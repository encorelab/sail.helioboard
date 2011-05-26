HelioRoom = {
    // config
    
    xmppDomain: 'proto.encorelab.org',
    groupchatRoom: 's3@conference.proto.encorelab.org',
    
    login: 'monitor',
    password: '9796809f7dae482d3123c16585f2b60f97407796',
    
    
    // private global vars
    
    ui: Sail.UI,
    groupchat: null,
    session: null,
    justWatching: false,
    
    
    // called at the end of the index.html load chain
  
    init: function() {
        console.log("Initializing HelioRoom...")
        
        // create custom event handlers for all HelioRoom 'on' methods
        Sail.autobindEvents(HelioRoom, {
            pre: function() {console.debug(arguments[0].type+'!',arguments)}
        })
        
        $('#connecting').show()
        
        HelioRoom.connectToXMPP()
    },
    
    
    connectToXMPP: function() {
        Sail.Strophe.bosh_url = '/http-bind/'
     	Sail.Strophe.jid = HelioRoom.login + '@' + HelioRoom.xmppDomain
      	Sail.Strophe.password = HelioRoom.password
  	
      	Sail.Strophe.onConnectSuccess = function() {
      	    sailHandler = Sail.generateSailEventHandler(HelioRoom)
      	    Sail.Strophe.addHandler(sailHandler, null, null, 'chat')
  	    
      	    HelioRoom.groupchat = Sail.Strophe.joinGroupchat(HelioRoom.groupchatRoom)
      	    HelioRoom.groupchat.addHandler(sailHandler)
  	    
      	    $('#connecting').hide()
      	    $(HelioRoom).trigger('joined')
      	}
  	    
  	    Sail.Strophe.connect()
    },
    
    
    events: {
        // mapping of Sail events to local Javascript events
        sail: {
            'submit_inquiry': 'gotInquiry',
            'update_inquiry': 'gotUpdate',
        },
        
        onGotInquiry: function(ev, sev) {
            title = sev.payload.inqTitle
            content = sev.payload.inqContent
            group = sev.payload.inqGroup
            id = group + '-' + sev.payload.inqId
            if (sev.payload.inqType == 'question') {
                row = $("<tr id='q-"+id+"'><td><h3 class='title'>"+title+"</h3><p class='content'><strong>"+group+":</strong> "+content+"</p><p class='comments'></p></td></tr>")
                row.hide()
                $('#questions').prepend(row)
                row.show('fade', 3000)
            } else if (sev.payload.inqType == 'discussion') {
                row = $("<tr id='d-"+id+"'><td><h3 class='title'>"+title+"</h3><p class='content'><strong>"+group+":</strong> "+content+"</p><p class='comments'></p></td></tr>")
                row.hide()
                $('#ideas').prepend(row)
                row.show('fade', 3000)
            }
        },
        
        onGotUpdate: function(ev, sev) {
            title = sev.payload.inqTitle
            content = sev.payload.inqContent
            group = sev.payload.inqGroup
            id = group + '-' + sev.payload.inqId
            if (sev.payload.inqType == 'question') {
                row = $('#q-'+id)
            } else if (sev.payload.inqType == 'discussion') {
                row = $('#d-'+id) 
            }
            comments = row.find('.comments')
            comments[0].innerHTML = sev.payload.inqComment.replace(/\n/g, "<br />")
            comments.effect("highlight", {}, 9000)
        },
        
        onJoined: function() {
            $('#feeds').show()
        }
    }
}