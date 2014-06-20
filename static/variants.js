var Clinvar = function($scope) {
    var genes = ['BRCA1', 'BRCA2', 'APC', 'MLH1', 'MLH2', 'MSH2', 'P16', 'p53', 'PTEN', 'ATM', 'CHEK2', 'ACTC', 'CDH23', 'DSC2', 'DSG2', 'DSP', 'GLA', 'HRAS', 'LAMP2', 'LDB3', 'LMNA', 'MYBPC3', 'MYH7', 'MYL2', 'MYL3', 'MYO7A', 'PKP2', 'PLN', 'PRKAG2', 'PTPN11', 'TAZ', 'TNNI3', 'TNNT2', 'TPM1', 'TTR', 'USH2A', 'FBN1', 'TGFBR2', 'TGFBR1', 'PMS2', 'MSH6', 'BRAF', 'KRAS', 'MEK1', 'MEK2', 'RAF1', 'SOS1', 'SHOC2', 'NRAS', 'TMEM43', 'ACTA2', 'ABCC9', 'DES', 'SGCD', 'VCL', 'HOPX', 'ACTN2', 'CSRP3', 'TCAP', 'CTF1', 'EMD', 'BARD1', 'BMPR1A', 'BRIP1', 'CDH1', 'EPCAM', 'MRE11A', 'MUTYH', 'NBN', 'PALB2', 'RAD50', 'RAD51C', 'SMAD4', 'STK11', 'TP53', 'MYH', 'MEN1', 'RET', 'VHL', 'HLRCC', 'CDK4', 'CDKN2A', 'RAD51D', 'MAX', 'NF1', 'SDHA', 'SDHAF2', 'SDHB', 'SDHC', 'SDHD', 'TMEM127', 'FH', 'FLCN', 'MET', 'MITF', 'TSC1', 'TSC2'],
        totalReports = 0,
        processedReports = 0,
        retMax = 1000,
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
        processedReports += submitRes.count;
        $scope.$apply(function() {
            $scope.progress = (processedReports/totalReports*100).toFixed(2) + '%';
            if (processedReports === totalReports || processedReports/totalReports > 0.99)
                if (processedReports === totalReports)
                    $scope.canDownload = true;
                else  // in case of getting stuck, wait for 10 secs then proceed to download
                    setTimeout(function() {
                        $scope.canDownload = true;
                    }, 10000);
        });
    };

    var DocumentParsingError = function() {
        this.message = 'Error parsing document from clinvar';
        this.name = 'DocumentParsingError';
    };


    var constructClinvarReport = function(targetGene, doc, download){
        var hgvsPattern = /.*?[cg]\.([\d_\+\-\?]+\S+)(?: \(.+?\))?/,
            report = new Object(),
            hgvs = doc.find('variation_set_name').first().text().match(hgvsPattern);
        report.variation = hgvs[1];
        report.gene = doc.find('gene_sort').first().text();
        if (download && report.gene != targetGene) {
            throw DocumentParsingError();
        }
        report.clinicalSignificance = doc.find('description').first().text();
        report.reviewStatus = doc.find('review_status').first().text();
        report.title = doc.find('title').first().text();
        report.reportId = doc.attr('uid');
        report.evaluated = doc.find('last_evaluated').first().text();
        var significance = report.clinicalSignificance;
        if (significance === 'not provided' ||
            significance === 'unknown' ||
            significance === 'Uncertain significance' || 
            significance === 'conflicting data from submitters' ||
            significance === 'other')
            throw DocumentParsingError();
        for (var key in report) {
            if (!report[key]) {
                throw DocumentParsingError();
            }
        }
        return report
    }



    var uploadReports = function(reportSet) {
        /*
        Upload a set of reports to server, which will then write those reports to a local file for download
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

    var displayReports = function(reportSet) {
        $scope.$apply(function() {
            Array.prototype.push.apply($scope.reports, reportSet.reports);
        });
    };

    var getClinvarReports = function(gene, idList, download) {
        var summaryUrl = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=clinvar&id=';
        if (download)
            var dealReports = uploadReports;
        else
            var dealReports = displayReports;
        $(idList).find('Id').each(function() {
            summaryUrl += ($(this).text() + ',');
        });
        $.getXML(summaryUrl, function(xml) {
            var reportSet = new Object();
            reportSet.target = targetId;
            reportSet.reports = new Array();
            $(xml).find('DocumentSummary').each(function(){
                try {
                    var report = constructClinvarReport(gene, $(this), download);
                    reportSet.reports.push(report);
                } catch (_) {
                    processedReports += 1;
                }
            });
            if (reportSet.reports.length > 0)
                dealReports(reportSet);
        });
    };


    var findReports = function(term, download) {
        if (download)
            var searchTerm = term + '[gene]';
        else
            var searchTerm = term;
        var searchUrl = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=clinvar&retmax='+retMax+'&term='+searchTerm,
            trialUrl = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=clinvar&retmax=0&term='+searchTerm;
        $.getXML(trialUrl, function(initSearch) {
            var count = parseInt($(initSearch).find('Count').first().text()),
                retStart = 0;
            totalReports += count;
            if (count > 0) {
                var searchReports = function() {
                    $.getXML(searchUrl+'&retstart='+retStart, function(idList) {
                        getClinvarReports(term, idList, download);
                    });
                    retStart += retMax;
                    if (retStart < count)
                        setTimeout(searchReports, 10); //prevent sending too many requests at the same time.
                }
                searchReports();
           } else if (!download) {
                $scope.$apply(function() {
                    $scope.noReportFound = true;
                });
           }
        });
        //if need to download, find all reports associated with all the genes
        if (download && genes.length > 0)
            findReports(genes.pop(), download);
    };


    return {
        download: function() {
            findReports(genes.pop(), true);
        },
        search: function(term) {
            findReports(term, false);
        },
        targetId: targetId
    };
};



