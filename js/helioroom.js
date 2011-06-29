HelioRoom = {
    // config
    
    xmppDomain: 'roadshow.encorelab.org',
    groupchatRoom: 's3@conference.encorelab.org',
    
    login: 'monitor',
    password: '9796809f7dae482d3123c16585f2b60f97407796', // "monitor"
    
    // private global vars
    
    ui: Sail.UI,
    groupchat: null,
    
    colors: ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'brown', 'gray', 'pink'],
    planets: ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"],
    
    
    // called at the end of the index.html load chain
  
    init: function() {
        console.log("Initializing HelioRoom...")
        
        // create custom event handlers for all HelioRoom 'on' methods
        Sail.autobindEvents(HelioRoom, {
            pre: function() {console.debug(arguments[0].type+'!',arguments)}
        })
        
        $('#tabs').tabs()
        
        $.each(HelioRoom.colors, function(i, c) {
            $("#"+c).click(function() {
                HelioRoom.showDataFor(c)
            })
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
  	    
      	    HelioRoom.groupchat = new Sail.Strophe.Groupchat(HelioRoom.groupchatRoom, "monitor-"+(new Date()).getTime().toString(36))
      	    HelioRoom.groupchat.addHandler(sailHandler)
      	    
      	    HelioRoom.groupchat.onSelfJoin = function(pres) {
      	        $('#connecting').hide()
          	    $(HelioRoom).trigger('joined')
      	    }
  	    
  	        HelioRoom.groupchat.join()
      	}
  	    
  	    Sail.Strophe.connect()
    },
    
    showDataFor: function(color) {
        $('#current-infront').css('fill', color)
        $('#current-behind').css('fill', color)
        $('#data').attr('visibility', 'visible')
        $('#current-infront circle, #current-behind circle').css('fill', color).attr('opacity', 'inherit')
        $.each(HelioRoom.colors, function(i, c) {
            $('#'+c).attr('opacity', 0.4)
            
            $('#behind circle[fill='+c+'], #infront circle[fill='+c+']').css('fill', c).attr('opacity', 'inherit')
            $('#current-infront .'+color+', #current-behind .'+color+', #behind .'+color+', #infront .'+color).css('fill', 'none').attr('opacity', '0.2')
            
            if (color == c)
                $('.current-'+c).attr('visibility', 'visible')
            else
                $('.current-'+c).attr('visibility', 'hidden')
        })
        $("#"+color).attr('opacity', 1)
    },
    
    createHypothesisBaloon: function(hyp) {
        title = hyp.title
        group = hyp.group
        color = hyp.color
        planet = hyp.planet
        
        baloon = $("<div class='baloon'><div class='predicate'>"+title+"</div><ul class='evidence'></ul></div>")
        HelioRoom.addEvidenceToHypothesisBaloon(baloon, hyp)
        
        baloon.attr('id', hyp.id)
        baloon.data('planet', planet)
        baloon.data('color', color)
        baloon.hide()
        field_height = $("#hypotheses").height()
        field_width = $("#hypotheses").width()
        
        if (field_height < 10)
            field_height = $("#observations-tab").height()
        if (field_width < 10)
            field_width = $("#observations-tab").width()
        
        baloon.css('left', (Math.random() * (field_width - 100) + 'px'))
        baloon.css('top', (Math.random() * (field_height - 100) + 'px'))
        baloon.addClass(color)
        baloon.addClass(planet)
        baloon.addClass(hyp.groupHypId)
        $("#hypotheses").append(baloon)
        baloon.show('puff', 'fast')
        baloon.mousedown(function() {
            zs = $('.baloon').map(function() {z = $(this).css('z-index'); return z == 'auto' ? 100 : parseInt(z)})
            maxZ = Math.max.apply(Math, zs)
            $(this).css('z-index', maxZ + 1)
        })
        
        baloon.draggable()
        return baloon
    },
    
    addEvidenceToHypothesisBaloon: function(baloon, hyp) {
        baloon.find('.evidence')
            .append("<li class='"+hyp.group+" hyp-"+hyp.inqId+"'><span class='group'>"+hyp.group+":</span> "+hyp.evidence+"</li><ul class='discussion "+hyp.group+" hyp-"+hyp.inqId+"'></ul>")
    },
    
    addCommentToEvidence: function(evidence, comment, group) {
        evidence
            .append("<li class='comment'><span class='group'>"+group+":</span> "+comment+"</li>")
    },
    
    processHypothesis: function(hyp) {
        if ($('#'+hyp.id).length == 0) {
            baloon = HelioRoom.createHypothesisBaloon(hyp)
            baloon.data('hypothesis', sev.payload.inqTitle)
        } else {
            baloon = $('#'+hyp.id)
            HelioRoom.addEvidenceToHypothesisBaloon(baloon, hyp)
        }
    },
    
    processDiscussion: function(disc) {
        d = $('.discussion.'+disc.authGroup+'.hyp-'+disc.inqId)
        c = d.find('li.'+disc.group)
        if (c.length == 0)
            d.append("<li class='"+disc.group+"'>"+disc.comments.replace("\n", "<br />")+"</li>") 
        else
            c.replaceWith("<li class='"+disc.group+"'>"+disc.comments.replace("\n", "<br />")+"</li>") 
    },
    
    
    events: {
        // mapping of Sail events to local Javascript events
        sail: {
            'inquiry_submitted': 'gotHypothesis',
            'inquiry_updated': 'gotInquiryUpdate',
            'observation_submitted': 'gotObservation'
        },
        
        onGotHypothesis: function(ev, sev) {
            hyp = sev.payload
            
            hyp.title = hyp.inqTitle
            hyp.group = hyp.inqGroup
            
            if (hyp.inqType == 'question' || hyp.inqType == 'question with comments') {
                hypParts = hyp.title.split(' is ')
                hyp.color = hypParts[0]
                hyp.planet = hypParts[1]
                hyp.id = hyp.color+"-is-"+hyp.planet
            } else {
                hyp.id = hyp.inqType.replace(/\s+/,"-") + "-" + hyp.group + "-" + hyp.inqId
            }
            
            hyp.comments = hyp.inqComment
            hyp.evidence = hyp.inqContent
            hyp.authGroup = hyp.inqAuthGroup
            
            if (hyp.inqType == 'question with comments' || hyp.inqType == 'discussion with comments') {
                HelioRoom.processDiscussion(hyp)
            } else {
                HelioRoom.processHypothesis(hyp)
            }
        },
        
        onGotObservation: function(ev, sev) {
            post = sev.payload.post
            pre  = sev.payload.pre
            
            if (!(post && pre))
                return // ignore observations that don't have both pre and post
            
            infront = $("#"+pre+"-infront-"+post)
            behind = $("#"+post+"-behind-"+pre)
            
            infront.text((infront.text() == "" ? 0 : parseInt(infront.text())) + 1)
            behind.text((behind.text() == "" ? 0 : parseInt(behind.text())) + 1)
        },
        
        onJoined: function() {
            $('#tabs').show()
        }
    }
}
