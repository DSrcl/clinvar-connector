var clinvarConnector = angular.module("ClinvarConnector", []);

clinvarConnector.controller("DownloadController", function($scope) {
    $scope.canDownload = false;
    clinvarManager = Clinvar($scope);
    $scope.targetId = clinvarManager.targetId;
    clinvarManager.download();
});

clinvarConnector.controller("SearchController", function($scope) {
	$scope.reports = new Array();
	$scope.done = false;
	clinvarManager = Clinvar($scope);
	$scope.search = function(term) {
		clinvarManager.search(term);
	};

	$scope.canShow = function(report) {
		if ($scope.sigFilter === undefined)
			return true;
		else
			return (report.clinicalSignificance === $scope.sigFilter);
	};

	$scope.setSigFilter = function(filter) {
		$scope.sigFilter = filter;
	};

	$scope.showSigFilter = function() {
		if ($scope.sigFilter === undefined)
			return "All";
		else
			return $scope.sigFilter;
	};

});