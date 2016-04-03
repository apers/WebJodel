function initializeJodelView() {
  var mapCanvas = document.getElementById('message-map');

  var mapOptions = {
    center: new google.maps.LatLng(59.91, 10.75),
    zoom: 12,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }

  jodelMap = new google.maps.Map(mapCanvas, mapOptions);

  getToken(function() {
    fetchPosts();
  });
}


function updatePosts() {
  MessageList.updateMessages();
};

function updatePosts2(data) {
  $('#feed-list').empty();
  data.forEach(function(post) {
    //console.log(post);
    if (post.image_url != null) {
      var newElem = $('<li class="jodel-message" style="backround-color: #' +
        post.color + '">' +
        '<div class="votebar">' + post.vote_count + '</div>' +
        '</li>');

      newElem.css('background-color', '#' + post.color);
      newElem.css('background-image', 'url(' + post.image_url + ')');
      newElem.css('background-size', '100%');

      $('#feed-list').append(newElem)

      newElem.click(function() {
        var win = window.open(post.image_url, '_blank');
        win.focus();
        newElem.fadeOut(200).fadeIn(200);
        var newLatLng = {
          lat: parseFloat(post.location.loc_coordinates.lat),
          lng: parseFloat(post.location.loc_coordinates.lng)
        };
        if (jodelMarker === false) {
          jodelMarker = new google.maps.Marker({
            position: newLatLng,
            map: jodelMap,
            draggable: false //make it draggable
          });
          jodelMap.setCenter(newLatLng);
        } else {
          jodelMarker.setPosition(newLatLng);
          jodelMap.setCenter(newLatLng);
        }
      });
    } else {
    }
  });
}
