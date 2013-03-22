// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Canidates = new Meteor.Collection("canidates");
Ballots=new Meteor.Collection("ballots");
TestCol=new Meteor.Collection("testcol");
Results=new Meteor.Collection("results");

if (Meteor.isClient) {
    Session.setDefault('ballotopen',true);
    Session.setDefault('pollmaster',true);

Template.viewController.viewset=function(){
    return Session.equals('viewset',true);
};

Template.viewController.pollmaster=function(){
    return Session.equals('pollmaster',true);
};
    

Template.ballotController.pollopen=function(){
    return Session.equals('ballotopen',true);
    };

Template.leaderboard.players = function () {
    return Canidates.find({pollid:Session.get('pollid')});
};
  
Template.leaderboard.pollopen=function(){
    return Session.equals('ballotopen',true);
    };
    
    
Template.ballotController.events({
    'click input.inc': function () {
        Session.set('ballotopen',false);
    }
  });
    
Template.ballotController.pollID=function(){
        return Session.get('pollid');
    };
   
    Template.viewController.events({
                                   'click input.inc1': function () {
                                   Session.set('pollmaster',true);
                                   Session.set('viewset',true);
                                   var newpollid=(Math.floor((Math.random()*100000)+1));
                                   while(Canidates.find({pollid:newpollid}).count()!=0){
                                   newpollid++;
                                   }
                                   Session.set('pollid',newpollid);
                                   Session.set('listpos',0);
                                   },
                                   'click input.inc2': function () {
                                   Session.set('pollmaster',false);
                                   Session.set('viewset',true);
                                   var newuserid=(Math.floor((Math.random()*1000000000000)+1)).toString();
                                   while(Ballots.find({userId:newuserid}).count()!=0){
                                   newuserid++;
                                   }
                                   Session.set('userId',newuserid);
                                   }
                                   });

  var okCancelEvents = function (selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};
  var ballotname="";

  var events = {};
  events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
    function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);

      } else if (evt.type === "keyup" && evt.which === 13 ||
                 evt.type === "focusout") {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };

  return events;
};


Template.addCanidate.events(okCancelEvents(
  '#new-todo',
  {
    ok: function (text, evt) {
     var listposition=Session.get('listpos');
      Canidates.insert({name: text, 
                     winner: false,
                    pollid: Session.get('pollid'),
                    listposition:listposition});

      Session.set('listpos',listposition+1);
      evt.target.value = '';
    }
  }));
  

Template.ballotManager.haspollid = function() {
    return (Session.get('pollid')!=null);
};
    
Template.ballotManager.unsubmitted = function() {
    return (Session.get('ballotopen')==true);
};
    
    Template.ballotManager.pollID= function() {
        return (Session.get('pollid'));
    };

Template.ballotManager.events(okCancelEvents(
                                            '#getpollid',
                                            {
                                            ok: function (text, evt) {
if(Canidates.find({pollid:parseInt(text)}).count()>0){
                                                            Session.set('pollid',parseInt(text));
    }

                                            evt.target.value = '';
                                            }
                                            }));
    



    
Template.ballot.itemlist = function() {
 
    if(TestCol.find({voter:Session.get('userId')}).count()==0){

        var cans;
        cans=Canidates.find({pollid:Session.get('pollid')},{sort:{listposition:1}}).fetch();
        _.each(cans, function(item) {
               TestCol.insert({name:item.name,listposition:item.listposition,voter:Session.get('userId')});
               });
    }
    
    console.log(Session.get('userId'));
    return TestCol.find({voter:Session.get('userId')},{sort:{listposition:1}});
};

    
Template.ballot.rendered = function() {
    var elem = $("table#items tbody");
    elem.sortable({
	revert: 100,
	update: function(event, ui) {
	    // build a new array items in the right order, and push them 
	    var rows = $(event.target).children('tr');
	    _.each(rows, function(element,index,list) {
		var id = $(element).data('id');
                   TestCol.update({_id: id}, {$set: {listposition: index}});

		});
	    }
	});
};
    Template.ballot.events({
       'click input.submit': function () {
        Session.set('ballotopen',false);
        var allCans;
        var names=new Array();
        var votes=new Array();
        allCans=TestCol.find({voter:Session.get('userId')},{sort:{listposition:1}}).fetch();
        _.each(allCans, function(item) {
            names.push(item.name);
            votes.push(item.listposition+1);
        });
    Ballots.insert({pollid:Session.get('pollid'),names:names,votes:votes,voter:Session.get('userId')});
    }});
    
    
    Template.results.Winner=function(){
        return runIRV(Ballots.find({pollid:Session.get('pollid')}).fetch()).winner();
    };
}
// On server startup, create some players if the database is empty.

if (Meteor.isServer) {
  Meteor.startup(function () {
      });
}
