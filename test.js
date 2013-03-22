//This file contains the code which handles the data storage and algorith control for the 
//Instant Runoff Voting portion of Rankvote.

//the fucntions below are collectively used to handle data that is passed in in the form of an
//array of ballots, which contain voters preference information.

//the main function that will be accessed outside the code here is runIRC(ballots), which returns the
//end result of the algorithm in a data structure designed to convey much about the process by
//which a decision was made.



//----------Basic Helpers----------------------------

//returns an array listing all of the candidates in an ballot
//tested with this:
//findCandidates( Ballots.find({pollid:4}).fetch()[0] )   yeilded    ["Orange", "Red", "Green", "Yellow", "Blue", "Purple"]
function findCandidates(ballot) {
    
    //I think we can just do this, and if that's the case it probably makes this irrelevant
    return ballot.names;
    
}

//'find' function, returns index of first item obj in array 'a'
//tested with this:
//arraySearch(Ballots.find({pollid:4}).fetch()[0].names,Ballots.find({pollid:4}).fetch()[0].names[3])     which yielded '3', as did this:   arraySearch(Ballots.find({pollid:4}).fetch()[0].names,"Yellow")
function arraySearch(a, obj) {
    for(var i = 0; i < a.length; i++) {
        if (a[i]==obj) {
            return i;
        }
    }
    return -1;
}

//returns the total sum of all values in an array
//tested: this--> arrayTotal([1, 2, 10, 100]) -->113.  and arrayTotal(Ballots.find({pollid:4}).fetch()[0].votes) --> 21
function arrayTotal(toSum) {
    var x = new Array();
    x=toSum;
    var toReturn=0;
    for(var i=0; i<x.length;i++) {
        toReturn= toReturn+x[i];
    }
    return toReturn;
}

//---------Initialization----------------------------

//resultTable object constructor
function resultTable(pollNumber, candidates, candidateList) {
    this.pollid=pollNumber;
    this.candidates=candidates; //array of contestant objects
    this.candidateList=candidateList;
    
    //returns the index of the candidate with the highest 'currentTotal'
    this.winning = function() {
        
        var winningCandidateIndex=0;
        for(var i=0; i<candidates.length; i++) {
            if(candidates[i].currentTotal>candidates[winningCandidateIndex].currentTotal){
                winningCandidateIndex=i;
            }
        }
        if(winningCandidateIndex>=0) return winningCandidateIndex;
        return "poop";
    }
    this.winner = function() {
        
        var winningCandidateIndex=0;
        for(var i=0; i<candidates.length; i++) {
            if(candidates[i].currentTotal>candidates[winningCandidateIndex].currentTotal){
                winningCandidateIndex=i;
            }
        }
        if(winningCandidateIndex>=0) return candidateList[winningCandidateIndex];
    }
    
}

//contestant object constructor
function contestant(name, roundResults, currentTotal) {
    this.name=name;
    this.roundResults=roundResults;
    this.currentTotal=currentTotal;
}

//initializes the results datastructure, which is empty.  returns a result table populated with one contestant for each of the candidates listed as options.  These contestants are named and initialized with empty arrays for round results and a total of 0.
function initResults(ballot) {
    
    var candidateList = ballot.names;
    var b = new Array();
    results = new resultTable(ballot.pollid,b.slice(0),candidateList);
    for(var i=0; i<candidateList.length; i++) {
        
        results.candidates[i]=new contestant(candidateList[i],new Array(),0);
        
    }
    return results;
}

//----Algorithm Handling-----------------------------------------

//finds the candidate with the lowest, non-zero number of votes and returns their name
//tested:  findSmallest([true, true, true, true, true, false],initResults(Ballots.find({pollid:4}).fetch()[0])) --> "Blue", purple if you change the last 'false' to true.
function findSmallest(active, results) {
    var toEliminate;
    var numVotes = 0;
    
    for(var i = 0; i < results.candidates.length; i++){
        var myVotes = (results.candidates[i].currentTotal) //make sure currentTotal has been updated
        
        if(active[i]) {
            if(myVotes>0 && numVotes == 0) {
                toEliminate = results.candidates[i].name;
                numVotes = results.candidates[i].currentTotal;
            } else if (myVotes<numVotes) {
                toEliminate = results.candidates[i].name;
                numVotes = results.candidates[i].currentTotal;
            }
        }
    }
    return toEliminate;
}

//this function takes in the status array and updates the votes, only allowing those who are 'active=true' to get votes.  Assigns each ballot's vote to the highest-ranking candidate still active.  Updates the results collection, adding an additional round to the resultTable array of arrays for each candidate as well as their currentTotal.
function countVotes(active, results, roundCounter, ballots){

    var a = Array();
    for(var i = 0; i < results.candidateList.length; i++) {
        a.push(0);
    }
    
    for(var i = 0; i < results.candidateList.length; i++) {
        (results.candidates[i].roundResults).push( new Array(results.candidateList.length) );
        results.candidates[i].roundResults[roundCounter]=a.slice(0);
        
    }
    
    for(var i = 0; i<ballots.length; i++) { //iterate through all the ballots
        
        console.log(ballots.length);
        
        var tempVote; //index in results.candidateList of the vote we're casting (which candidate)
        var tempVoteRank = (active.length+1); //what preference that vote is, ie 1st choice --> 1, etc
        //
        for(var j = 0; j<results.candidateList.length; j++) {
            if(active[j]){ //only concider giving the vote to this candidate if they're still active.
                //temporarily assign the vote to candidate i if their ranking on ballot is lower than the current tempVoteRank
                var candRank = ballots[i].votes[ arraySearch( ballots[i].names, results.candidateList[j])];
                if( candRank < tempVoteRank) {
                    tempVote = j;
                    tempVoteRank = candRank;
                }
            }
        }
        
        //this registers the vote for this ballot: it finds the candidate receiving the vote in results, then increments the cell referring to the round in which we are counting for and then the rank-preference of the voter--so if the candidate was their third choice it would go into the round's array at index=3-1=2. Thus the total of all the values in that round's array is their total vote/score for the round.
        
        results.candidates[tempVote].roundResults[roundCounter][tempVoteRank-1]++;

        results.candidates[tempVote].currentTotal=arrayTotal(results.candidates[tempVote].roundResults[roundCounter]);
        
    }
    
    return results;
    
}



//this function takes in the status array and updates the votes, only allowing those who are 'active=true' to get votes.  Assigns each ballot's vote to the highest-ranking candidate still active.  Updates the results collection, adding an additional round to the resultTable array of arrays for each candidate as well as their currentTotal.
//accepts ballots as a string of ballots.
/*
function countVotes(active, roundCounter, ballots, results){
    
    for(var i = 0; i < ballots.length; i++) {
        
        var tempVote;//holds the index of the candidate that the ballot is currently voting for
        var tempVoteRank = (active.length+1);
        
        for(var j = 0; j<results.candidateList.length; j++) {
            if(active[i]){ //only concider giving the vote to this candidate if they're still active.
                
                return arraySearch(ballots[i].names,results.candidateList[j]);
                
                if(arraySearch(ballots[i].names,results.candidateList[j])>tempVoteRank)
                
            }
        }
        
        //register the vote for the ballot to whoever now occupies tempVote.  Increments the value that is stored for the candidate at index tempVote, under the roundResult array at index roundCounter at position tempVoteRank-1, to indicate if this is a first choice, second choice, etc vote.
        results.candidates[tempVote].roundResults[roundCounter][tempVoteRank-1]++;
        results.candidates[tempVote].currentTotal++; //also increment the same candidates current total.
        
    }
    
    return results;
    
}
 */

//runs the cycles of vote counts until someone has >50% of the vote, updating and adding to the results collection as it does.
function runIRV(ballots) {
    
    results=initResults(ballots[0]);
    
    var roundCounter = 0;
    var winningCandidate;
    
    active = new Array();

    for(var i=0; i<(results.candidateList.length); i++){
        active[i]=true;
    }
    
    
    //while loop cycles until one candidate has more than 50% of the vote
    while(true) {
        
        results = countVotes(active, results, roundCounter, ballots);
        
        winningCandidateIndex = results.winning();
        
        if( results.candidates[winningCandidateIndex].currentTotal/ballots.length > (.5) )break; //CHECK::possible place for an error to hide: bascally thisis supposed to break the cycle if the current winning candidate has more than half of total votes, but im not sure whether my total vote querey is going to get me the right thing.
        
        toElim = findSmallest(active, results);
        
        console.log(toElim);
        
        elimIndex = arraySearch(results.candidateList, toElim);
        active[elimIndex]=false;
        results.candidates[elimIndex].currentTotal=0;
        roundCounter++;
    }
    
    return results;
}



