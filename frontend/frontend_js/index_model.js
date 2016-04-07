/* 
 *
 * Map component
 *
 */
var Map = React.createClass({
	globalLat: null,
	globalLng: null,
	marker: null,
    getInitialState: function() {
        return {};
    },
    componentDidMount: function() {
    	this.initializeMap();
    },
    findLocationName: function(callback) {
        var geocoder = new google.maps.Geocoder;
        var loc = this.marker.getPosition();
        var latlng = {
            lat: loc.lat(),
            lng: loc.lng()
        };
        geocoder.geocode({
            'location': latlng
        }, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                	callback({
                		cityName: results[0].address_components[3].short_name,
                		countryName: results[0].address_components[5].short_name
                	});
                }
            }
        }.bind(this));
    },
    updateMarkerLocation: function() {
        var loc = this.marker.getPosition();
        this.findLocationName(function(locationInfo) {
            locationInfo.lat = loc.lat();
            locationInfo.lng = loc.lng();
            this.props.changeLocationCallback(locationInfo);
        }.bind(this));

    },
    initializeMap: function() {
        var mapCanvas = document.getElementById('map');

        var mapOptions = {
            center: new google.maps.LatLng(59.91, 10.75),
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }

        var map = new google.maps.Map(mapCanvas, mapOptions);

        google.maps.event.addListener(map, 'click', function(event) {
            var clickedLocation = event.latLng;
            if (this.marker == null) {
                //Create the marker.
                this.marker = new google.maps.Marker({
                    position: clickedLocation,
                    map: map,
                    draggable: true //make it draggable
                });
                //Listen for drag events!
                google.maps.event.addListener(this.marker, 'dragend', function(event) {
                    this.updateMarkerLocation();
                });
                this.updateMarkerLocation();
            } else {
                //Marker has already been added, so just change its location.
                this.marker.setPosition(clickedLocation);
                this.updateMarkerLocation();
            }
        }.bind(this));
    },
    render: function() {
        return ( <div id="map"></div>);
	}
});

/*
 *
 *
 *
 */
var LocationChooser = React.createClass({
	locationInfo: null,
	accessToken: null,
	getInitialState: function() {
		return {city: '-',};
	},
    // Hide map and shoe message view
	goButtonClick: function() {
		this.getJodelToken(this.locationInfo);
		$('#location-chooser').slideUp();
    	$('#message-view').fadeIn();
	},
    // Get previous used hash from cookies
	getHashFromCookies: function() {
        var cookieHash = /hash=(.+)/.exec(document.cookie);
        if (cookieHash == null) {
            return false;
        } else {
            return cookieHash[1];
        }
	},
    // Fetch API-token from backend
	getJodelToken: function(locationInfo) {
        var hash = this.getHashFromCookies();
        if (hash == false) {
            $.post('http://localhost:8080/token', {
                city: locationInfo.cityName,
                lat: locationInfo.lat,
                lng: locationInfo.lng,
                country: locationInfo.countryName
            }, function(data) {
                var pjson = JSON.parse(data);
                /* Save UID for later use */
                document.cookie = "hash=" + pjson.hash;
                this.props.tokenCallback(pjson.access_token);
            }.bind(this));
        } else {
            $.post('http://localhost:8080/token', {
                city: locationInfo.cityName,
                lat: locationInfo.lat,
                lng: locationInfo.lng,
                hash: hash,
                country: locationInfo.countryName
            }, function(data) {
                var pjson = JSON.parse(data);
                this.props.tokenCallback(pjson.access_token);
            }.bind(this));
        }
	},
	changeLocation: function(locationInfo) {
		this.setState({city: locationInfo.cityName});
		this.locationInfo = locationInfo;
		$('#go-button').css('visibility', 'visible');
	},
	render: function() {
		return(
			<div id="location-chooser">
				<Map changeLocationCallback={this.changeLocation}/>
				<div id="location-info">
					<h3>Choose location:</h3>
    				<h3 id="city">{this.state.city}</h3>
					<button id="go-button" type="button" onClick={this.goButtonClick} className="btn-lg btn-primary disabled">Go!</button>    				
				</div>
			</div>
			);}
});


/**
*
* Message view 
*
*/

var LocationMap = React.createClass({
	map: null,
	marker: null,
	componentDidMount: function() {
		this.initializeMap();
	},
	componentDidUpdate: function() {
        if (this.marker == null) {
          this.marker = new google.maps.Marker({
            position: this.props.map_pin_loc,
            map: this.map,
            draggable: false
          });
          this.map.setCenter(this.props.map_pin_loc);
        } else {
          this.marker.setPosition(this.props.map_pin_loc);
          this.map.setCenter(this.props.map_pin_loc);
        }
		google.maps.event.trigger(this.map,'resize');
	},
	initializeMap: function() {
        var mapOptions = {
            center: new google.maps.LatLng(59.91, 10.75),
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }

        this.map = new google.maps.Map(document.getElementById('location-map'), mapOptions);
	},
	render: function() {
		return(
			<div id="location-map"></div>
		);
	}
});

/*
 *
 * Message component
 *
 */

var Message = React.createClass({
	children: null,
	getInitialState: function() {
		return{
			renderChildren: false
		}
	},
	clickedMessage: function() {
		this.setState({renderChildren: !this.state.renderChildren});
		
		this.props.setMapPin({
          lat: parseFloat(this.props.postData.location.loc_coordinates.lat),
          lng: parseFloat(this.props.postData.location.loc_coordinates.lng)
        });

        if(this.props.image_url != null) {
       		var win = window.open(this.props.image_url, '_blank');
        	win.focus();
        }
	},
	render: function() {
		var message_text = this.props.message_text;
		if(this.props.image_url != null) {
			var divstyle = {
				backgroundColor: '#'+this.props.color,
				backgroundImage: 'url(' + this.props.image_url + ')',
				backgroundSize: '100%'
			}
			message_text = "";
		} else {
			var divstyle = {
				backgroundColor: '#'+this.props.color 
			}
		}

		if(this.state.renderChildren == true) {
			console.log(this.props.children);
			this.children = this.props.children.map(function(child) {
				console.log(child.color);
				var childstyle = {
					backgroundColor: '#'+child.color 
				};
				return(
					<div className="message-child" style={childstyle}><p>{child.message}</p></div>
				);
			});
		} else {
			this.children = [];
		}

		return(
			<div className="jodel-message" style={divstyle} onClick={this.clickedMessage}>
				<p>{message_text}</p>
				<div className="votebar">Children: {this.props.children.length} Votes:{this.props.vote_count}</div>
				{this.children}
			</div>
		);
    }
});

/*
 *
 * Message list component
 *
 */

var MessageList = React.createClass({
	componentDidMount : function() {
		var feed = document.getElementById('message-feed');
		feed.addEventListener('scroll', function(event) {
			console.log(feed);
		});
	},
    updateMessages: function(messageData) {
    	this.props.updateCallback();
	},
	render: function() {
		var messageComponents = this.props.messages.map(function(message) {
			return(
				<Message 
				key={message.post_id}
				children={message.children || []}
				vote_count={message.vote_count}
				color={message.color}
				message_text={message.message}
				setMapPin={this.props.setMapPin}
				image_url={message.image_url}
				postData={message}/>
			);
		}.bind(this));
		if(this.props.messages.length == 0) {
			return(
				<div id="message-feed">
					<button id="update-button" type="button" onClick={this.updateMessages} className="btn-lg btn-primary disabled">Update</button>
  					<div className="spinner">
  						<div className="cube1"></div>
  						<div className="cube2"></div>
  					</div>
				</div>
			);
		} else {
			return (
				<div id="message-feed">
					<button id="update-button" type="button" onClick={this.updateMessages} className="btn-lg btn-primary disabled">Update</button>    				
					{messageComponents}
            	</div>
        	);
		}
	}
});

/*
 *
 * Message view component
 *
 */
var MessageView = React.createClass({
	componentDidMount: function() {
        window.onunload = function(){
	        return false;
        }   
	},
	render: function() {
		return(
		<div id="message-view">
			<MessageList
				messages={this.props.messages}
				updateCallback={this.props.updateCallback}
				setMapPin={this.props.setMapPin}/>
			<LocationMap map_pin_loc={this.props.map_pin_loc}/>
		</div>
		);
	}
});

/*
 *
 * Main view component
 *
 */
var Content = React.createClass({
	accessToken: null,
	getInitialState: function() {
		return {
            messages: [],
	        map_pin_location: {lat: 59.91, lng: 10.75}
		};
	},
	setMapPinCallback: function(location) {
		this.setState({map_pin_location: location});
	},
    updateMessages: function() {
        $.ajax({
            url: "http://localhost:8080/posts",
            headers: {
                token: this.accessToken
            },
            type: "GET",
            success: function(data) {
                this.setState({
                    messages: JSON.parse(data).posts
                });
            }.bind(this)
        });
    },
	gotToken: function(accessToken) {
		this.accessToken = accessToken;
		this.updateMessages();
	},
	render: function() {
		return(
			<div id="app">
				<LocationChooser tokenCallback={this.gotToken}/>
				<MessageView map_pin_loc={this.state.map_pin_location} messages={this.state.messages} updateCallback={this.updateMessages} setMapPin={this.setMapPinCallback}/>
			</div>
		);
	}
});

ReactDOM.render(<Content/>, document.getElementById('content'));
