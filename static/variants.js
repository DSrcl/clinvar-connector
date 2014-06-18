var Clinvar = function($scope) {
    var genes = ['BRCA1', 'BRCA2', 'APC', 'MLH1', 'MLH2', 'MSH2', 'P16', 'p53', 'PTEN', 'ATM', 'CHEK2', 'ACTC', 'CDH23', 'DSC2', 'DSG2', 'DSP', 'GLA', 'HRAS', 'LAMP2', 'LDB3', 'LMNA', 'MYBPC3', 'MYH7', 'MYL2', 'MYL3', 'MYO7A', 'PKP2', 'PLN', 'PRKAG2', 'PTPN11', 'TAZ', 'TNNI3', 'TNNT2', 'TPM1', 'TTR', 'USH2A', 'FBN1', 'TGFBR2', 'TGFBR1', 'PMS2', 'MSH6', 'BRAF', 'KRAS', 'MEK1', 'MEK2', 'RAF1', 'SOS1', 'SHOC2', 'NRAS', 'TMEM43', 'ACTA2', 'ABCC9', 'DES', 'SGCD', 'VCL', 'HOPX', 'ACTN2', 'CSRP3', 'TCAP', 'CTF1', 'EMD', 'BARD1', 'BMPR1A', 'BRIP1', 'CDH1', 'EPCAM', 'MRE11A', 'MUTYH', 'NBN', 'PALB2', 'RAD50', 'RAD51C', 'SMAD4', 'STK11', 'TP53', 'MYH', 'MEN1', 'RET', 'VHL', 'HLRCC', 'CDK4', 'CDKN2A', 'RAD51D', 'MAX', 'NF1', 'SDHA', 'SDHAF2', 'SDHB', 'SDHC', 'SDHD', 'TMEM127', 'FH', 'FLCN', 'MET', 'MITF', 'TSC1', 'TSC2'],
        searchFinished = false,
        totalReports = 0,
        processedReports = 0,
        retMax = 500,
        targetId = Math.random().toString(36).substring(7);
        
    $.getXML = function(url, callback) {
        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'xml',
            success: callback
        });
    };

    var tryDownload = function (submitRes) {
        /*
        Check if all reports are submitted to server, if yes
        download the file
        */
        console.log(submitRes);
        processedReports += submitRes.count;
        $scope.$apply(function() {
            $scope.progress = (processedReports/totalReports*100).toFixed(2) + '%';
        });
    };

    var DocumentParsingError = function() {
        this.message = 'Error parsing document from clinvar';
        this.name = 'DocumentParsingError';
    };


    var constructClinvarReport = function(targetGene, doc){
        var hgvsPattern = /.*?[cg]\.([\d_\+\-\?]+\S+)(?: \(.+?\))?/,
            report = new Object(),
            hgvs = doc.find('variation_set_name').first().text().match(hgvsPattern);
        report.variation = hgvs[1];
        report.gene = doc.find('gene_sort').first().text();
        if (report.gene != targetGene)
            throw DocumentParsingError();
        report.clinicalSignificance = doc.find('description').first().text();
        report.reviewStatus = doc.find('review_status').first().text();
        for (var key in report) {
            if (!report[key]) {
                throw DocumentParsingError();
            }
        }
        return report
    }



    var submitReports = function(reportSet) {
        /*
        Submit a set of reports to server, which will then check if any of the reports matches the read set.
        */
        $.ajax({
            type: 'POST',
            url: '/submit_reports',
            beforeSend: function(request) {
                request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
            },
            data: JSON.stringify(reportSet),
            success: tryDownload
        });
    };


    var getClinvarReports = function(gene, idList) {
        var summaryUrl = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=clinvar&id=';
        $(idList).find('Id').each(function() {
            summaryUrl += ($(this).text() + ',');
        });
        $.getXML(summaryUrl, function(xml) {
            var reportSet = new Object();
            reportSet.target = targetId;
            reportSet.reports = new Array();
            $(xml).find('DocumentSummary').each(function(){
                try {
                    var report = constructClinvarReport(gene, $(this));
                } catch (e) {
                    processedReports += 1;
                    return;
                }
                reportSet.reports.push(report);
            });
            if (reportSet.reports.length > 0)
                submitReports(reportSet);
        });
    };


    var downloadTerm = function(term) {
        var searchUrl = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=clinvar&retmax='+retMax+'&term='+term+'[gene]',
            trialUrl = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=clinvar&retmax=0&term='+term;
        $.getXML(trialUrl, function(initSearch) {
            var count = parseInt($(initSearch).find('Count').first().text()),
                retStart = 0;
            totalReports += count;
            if (count > 0) {
                function searchReports() {
                    $.getXML(searchUrl+'&retstart='+retStart, function(idList) {
                        getClinvarReports(term, idList);
                    });
                    retStart += retMax;
                }
                setTimeout(searchReports, 10); //prevent too many HTTP requests at the same time.
           }
        });
        if (genes.length > 0)
            downloadTerm(genes.pop());
        else
            searchFinished = true;
    }


    return {
        download: function() {
            downloadTerm(genes.pop());
        },
        targetId: targetId
    };
};



