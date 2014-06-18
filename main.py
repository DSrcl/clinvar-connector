from flask import Flask, render_template, json, request, jsonify
import os

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
    

@app.route('/download')
def download():
    return render_template('downloader.html')

    
  

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
    return render_template('index.html')
    

if __name__ == '__main__':
    app.run(debug=True)