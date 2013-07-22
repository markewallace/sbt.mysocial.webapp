/*
 * � Copyright IBM Corp. 2013
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); 
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at:
 * 
 * http://www.apache.org/licenses/LICENSE-2.0 
 * 
 * Unless required by applicable law or agreed to in writing, software 
 * distributed under the License is distributed on an "AS IS" BASIS, 
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or 
 * implied. See the License for the specific language governing 
 * permissions and limitations under the License.
 */

/**
 * 
 */
define([ "sbt/declare", "sbt/config", "sbt/lang", "sbt/dom", "sbt/widget/_TemplatedWidget", "sbt/config", "sbt/smartcloud/ProfileService" ], 
	function(declare, config, lang, dom, _TemplatedWidget, config, ProfileService) {
	
	function getTemplateString(domId) {
        var domNode = dom.byId(domId);
        return domNode ? domNode.innerHTML : "<img/><h3/><span/><span/><span/>";
    }
    
    /**
     * @class MyProfile
     * @namespace widgets
     * @module widgets.MyProfile
     */
   var MyProfile =  declare(_TemplatedWidget, {
	   
	    templateId: "myapp.MyProfileTmpl",

	    templateString: null,
	   
	    listeners: null,
        
        myEndpoint : "smartcloudOA2",
        	
        /**
         * Constructor function
         * @method constructor
         */
        constructor: function(args) {
        	lang.mixin(this, args);
        	
        	this.templateString = getTemplateString(this.templateId);
        	this.listeners = [];
        },
        
        addListener: function(listener) {
        	this.listeners.push(listener);

        	// notify the listener if profile are already loaded
        	if (this.profile) {
        		listener.apply(this, [ this.profile ]);
        	}        	
        },
        
        /**
         * Called after the grid is created
         * The semanticTagService is loaded, which is responsible for displaying business card functionality.
         * @method postCreate
         */
        postCreate: function() {        	
        	this.inherited(arguments);
        },
        
        getEmail: function() {
        	if (this.profile) {
        		return this.profile.getEmail();
        	}
        },
        
        isAuthenticated : function() {
            var endpoint = config.findEndpoint(this.myEndpoint);
        	return endpoint.isAuthenticated;
        },
        
        login : function() {
            var self = this;
            var endpoint = config.findEndpoint(this.myEndpoint);
            endpoint.authenticate().then(
                function(response){
                    document.body.className="loggedin";
                    self.retrieveProfile(endpoint);
                },
                function(){
                    document.body.className="loggedout";
                    console.log("Failed to authenticate to endpoint "+self.endpoint)   
                }
            );
        },
        
        logout : function() {
            var endpoint = config.findEndpoint(this.myEndpoint);
            endpoint.logout().then(
            	function(logoutResult){
                    document.body.className="loggedout";
    			},
    			function(logoutResult){
    				console.log("Failed to logout");
    			}
    		);
        },
        
        retrieveProfile: function(endpoint) {
        	config.Properties["loginUi"] = "dialog";
        	var self = this;
        	var ep = endpoint || config.findEndpoint(this.myEndpoint);
            var url = "/manage/oauth/getUserIdentity";
            if (ep.isAuthenticated) {
                var options = { handleAs : "json" };
                ep.request(url, options).then(
            		function(response) {
                        var profileId = response.subscriberid;
            			self.handleUserId(profileId);
            		},
                    function(error) {
                        console.log(error);
                    }
            	);    
            }
        },
       
    	handleUserId: function(userid) {
        	var self = this;
    		var profileService = new ProfileService();
    		profileService.getProfileByGUID(userid).then(
    			function(profile) {
    				self.profile = profile;
                    self.imgNode = dom.byId("myPhoto");
                    var photoUrl = profile.getThumbnailUrl();
                    if (photoUrl.match("false$")!=null){
                      photoUrl =  photoUrl.substring(0, photoUrl.indexOf("photos/false")) + "noContactImage.gif";
                    }
                    self.imgNode.src = photoUrl;
                    dom.setText("myName", profile.getDisplayName());
                    dom.byId("loader").className="hidden-all";
                    dom.byId("loaded").className="";
    				self.notifyListeners(profile);
    			},
                function(error) {
                    console.log(error)
                }
    		);
    	},
    	
    	notifyListeners: function(profile) {
       		for (var i=0; i<this.listeners.length; i++) {
       			this.listeners[i].apply(this, [ profile ]);
        	}
    	}
    });
	
    return MyProfile;
});
