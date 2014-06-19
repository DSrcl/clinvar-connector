from flask import Flask, render_template, json, request, jsonify, Response
import os
import glob
import csv
from xlsxwriter.workbook import Workbook

app = Flask(__name__)
app.config['HOME'] = os.path.dirname(os.path.abspath(__file__))
app.config['DOWNLOADS'] = os.path.join(app.config['HOME'], 'downloads')

#create download directory if doesnt exist...
if not os.path.exists(app.config['DOWNLOADS']):
    os.makedirs(app.config['DOWNLOADS'])

def report_to_row(report):
    '''
    Turn report into a csv row delimited by comma
    '''
    return ','.join([
        report['gene'],
        report['variation'],
        report['clinicalSignificance'],
        'Clinvar',
        '',
        '',
        report['reviewStatus']
    ])
    

def csv_to_xlsx(file_path):
    '''
    Convert CSV to spreadsheet
    '''
    xls_path = file_path.split('.')[0] + '.xlsx'
    workbook = Workbook(xls_path)
    worksheet = workbook.add_worksheet()
    with open(file_path, 'rb') as f:
        reader = csv.reader(f)
        for r, row in enumerate(reader):
            for c, col in enumerate(row):
                worksheet.write(r, c, col)
    workbook.close()

    return xls_path


def prepare_csv(file_path):
    '''
    Add header and row count to csv
    '''
    prepared_path = file_path.split('.')[0] + '-prepared.csv'
    with open(prepared_path, 'w') as prepared:
        headers = ['','geneName','mutation','signficance','source','geneRegion','externalId','status']
        prepared.write(','.join(headers)+'\n')
        with open(file_path, 'r') as original:
            for i, row in enumerate(original):
                new_row = [str(i+1)] + row.split(',')
                prepared.write(','.join(new_row))

    return prepared_path





@app.route('/download/')
def download():
    return render_template('downloader.html')


@app.route('/download/<file_id>')
def retrieve_result(file_id):
    file_path = os.path.join(app.config['DOWNLOADS'], file_id+'.csv')
    if not os.path.isfile(file_path):
        return '', 404
    prepared_csv = prepare_csv(file_path)
    xls_file = csv_to_xlsx(prepared_csv)
    result = open(xls_file)
    response = Response(result, mimetype='application/xlsx')  
    response.headers["Content-Disposition"] = "attachment; filename=clinvar_variants.xlsx"
    return response


@app.route('/submit_reports', methods=['POST'])
def submit_reports():
    report_set = json.loads(request.data)
    target = os.path.join(app.config['DOWNLOADS'], report_set['target'] + '.csv')
    with open(target, 'a') as target_file:
        for report in report_set['reports']:
            new_row = report_to_row(report)
            target_file.write(new_row + '\n')
    return jsonify({'count': len(report_set['reports'])})



@app.route('/')
def index():
    if request.args.get('term'):
        searchCommand = 'search("%s")' % request.args['term']
    else:
        searchCommand = ''
    return render_template('index.html', searchCmd=searchCommand, term=request.args.get('term'))
    

if __name__ == '__main__':
    app.run(debug=True)