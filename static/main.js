var clinvarConnector = angular.module("ClinvarConnector", []);

clinvarConnector.controller("DownloadController", function($scope) {
    $scope.canDownload = false;
    clinvarManager = Clinvar($scope);
    $scope.targetId = clinvarManager.targetId;
    clinvarManager.download();
});

