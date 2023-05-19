export var QuestionStatus;
(function (QuestionStatus) {
    QuestionStatus[QuestionStatus["Discarded"] = 0] = "Discarded";
    QuestionStatus[QuestionStatus["Answered"] = 1] = "Answered";
    QuestionStatus[QuestionStatus["Queued"] = 2] = "Queued";
})(QuestionStatus || (QuestionStatus = {}));
export var QuestionFlag;
(function (QuestionFlag) {
    QuestionFlag[QuestionFlag["unansweredButTransfered"] = 0] = "unansweredButTransfered";
    QuestionFlag[QuestionFlag["RAFOed"] = 1] = "RAFOed";
})(QuestionFlag || (QuestionFlag = {}));
export var QuestionUserRelationship;
(function (QuestionUserRelationship) {
    QuestionUserRelationship[QuestionUserRelationship["Voter"] = 0] = "Voter";
    QuestionUserRelationship[QuestionUserRelationship["Asker"] = 1] = "Asker";
    QuestionUserRelationship[QuestionUserRelationship["Editor"] = 2] = "Editor";
})(QuestionUserRelationship || (QuestionUserRelationship = {}));
