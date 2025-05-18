var chatInitiated = false;
$(document).ready(function() {
    // Initialize map (hidden by default)
    initMap();
    
    // Search toggle functionality
    $('.search-icon').click(function(e) {
        e.stopPropagation();
        $('.search-input').toggleClass('active').focus();
    });
    // Toggle map functionality
    $('.filter-toggle').click(function() {
        const filterKey = $(this).data('filter');
        $(this).toggleClass('active');
        if ($(this).hasClass('active')) {
            map.addLayer(filters[filterKey].layer);
        } else {
            map.removeLayer(filters[filterKey].layer);
        }
    });
            
    // Map view toggle
    $('.map-icon').click(function() {
        $('.views:visible').fadeOut(300, function() {
            $('.map-view').fadeIn(300);
            $('.map-icon').removeClass('active');
            $('.dashboard-icon').addClass('active');
            setTimeout(function() {
                map.invalidateSize();
            }, 300);
        });
    });
    // When the AI Coach button is clicked
    $('.view-btn').click(function() {
        let id = $(this).data("id");
        console.log(id);
        $('.views:visible').fadeOut(300, function() {
            $('#'+id+"-view").fadeIn(300);
            if(!chatInitiated && id=="ai"){
                chatInitiated = true;
                setTimeout(function(){ showWelcomeMessage(); },500);
            }
        });
            
    });    
    // Dashboard view toggle (from map)
    $('.dashboard-icon').click(function() {
        $('.views:visible').fadeOut(300, function() {
            $('.dashboard-view').fadeIn(300);
            $('.dashboard-icon').removeClass('active');
            $('.map-icon').addClass('active');
        });
    });
    
    // Quick action buttons
    $('.action-card').click(function() {
        const minutes = $(this).data('minutes');
        showMeditationModal(minutes);
    });
    
    // Play button for sessions
    $('.btn-play').click(function(e) {
        e.stopPropagation();
        const sessionTitle = $(this).closest('.session-card').find('h3').text();
        showPopup("Recommendation",'Now Playing: '+sessionTitle,"default");
        // showPlayerModal(sessionTitle);
    });
    
    // Sidebar navigation
    $('.sidebar-menu li').click(function() {
        $('.sidebar-menu li').removeClass('active');
        $(this).addClass('active');
    });
    
    // Map filter functionality
    $('.filter').click(function() {
        const filter = $(this).data('filter');
        toggleMapFilter(filter);
        $(this).toggleClass('active');
    });
    
});

var state = {
  stream: null,
  audioContext: null,
  gainNode: null,
  isSessionActive: false,
  doctorVideoUrl: "video/psychologist_female.mp4"
};

$(document).ready(function() {
  // DOM Elements
  const $sessionBtn = $('#session-btn');
  const $localVideo = $('#local-video');
  const $doctorVideo = $('#doctor-video');
  const $doctorLoader = $('.doctor-loader');
  const $avatarPlaceholders = $('.avatar-placeholder');
  const $reviewSection = $('.review-section');
  const $micBtn = $('.mic-btn');
  const $cameraBtn = $('.camera-btn');
  const $swapBtn = $('.swap-btn');
  const $volumeSlider = $('.slider-camera');
  const $volumeLevel = $('.volume-level');
  const $ratingStars = $('.rating-stars span');

  // Event Listeners
  $sessionBtn.on('click', toggleSession);
  $micBtn.on('click', toggleMicrophone);
  $cameraBtn.on('click', toggleCamera);
  $swapBtn.on('click', toggleView);
  $volumeSlider.on('input', updateVolume);
  $ratingStars.on('click', rateQuestion);

  // Toggle Session
  async function toggleSession() {
    if (state.isSessionActive) {
      endSession();
    } else {
      await startSession();
    }
  }


function scrollToReviewSection() {
     $('#review-section').show();
  // Calculate offset (you can adjust this if you have a fixed header)
  const offset = 20; // Optional: Add some pixels above the target
  
  // Smooth scroll animation
  $('html, body').animate({
    scrollTop: $('#review-section').offset().top - offset
  }, 800); // 800ms animation duration
}


  // Start Session
  async function startSession() {
      $('.review-section').hide();
    try {
      $sessionBtn.html(`
        <svg class="icon spinner" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4"/>
        </svg>
        <span>Connecting...</span>
      `).prop('disabled', true);

// Request camera with better error handling
      state.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      }).catch(err => {
        console.error("Camera Error:", err);
        throw err;
      });

      // Debugging: Log stream info
      console.log("Stream obtained:", state.stream);
      console.log("Video tracks:", state.stream.getVideoTracks());
      
      // Verify video element
      if (!$localVideo.length) {
        console.error("Local video element not found");
        return;
      }

      // Assign stream to video element
      const videoElement = $localVideo[0];
      videoElement.srcObject = state.stream;
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = resolve;
      });
      
      videoElement.play().catch(e => console.warn("Video play warning:", e));
      $localVideo.show();
      $('.local-view .avatar-img').hide();

      // Show loading for doctor
      $doctorLoader.fadeIn();
      $('.remote-view .avatar-img,.avatar-placeholder').hide();

      // Initialize audio
      initAudio();

      // Simulate doctor joining after 3 seconds
      setTimeout(async () => {
        $doctorLoader.hide();
        try {
          $doctorVideo.attr('src', state.doctorVideoUrl);
          // Modern browsers need this to be a promise
          await $doctorVideo[0].play();
          $doctorVideo.show();
        } catch (videoError) {
          console.error("Video playback error:", videoError);
          // Fallback to showing avatar if video fails
          $doctorVideo.hide();
          $('.remote-view .avatar-img').show();
        }
        
        // Activate controls
        activateControls();
        $sessionBtn.html(`
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
          <span>Close Session</span>
        `).addClass('active').prop('disabled', false);
        
        state.isSessionActive = true;
      }, 3000);

    } catch (error) {
      console.error("Media Error:", error);
      alert(`Could not access media devices: ${error.message}`);
      resetSessionButton();
    }
  }

  // End Session
  function endSession() {
      scrollToReviewSection();
    // Stop media streams
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }
    if (state.audioContext && state.audioContext.state !== 'closed') {
      state.audioContext.close();
    }
    
    // Reset videos
    $localVideo[0].srcObject = null;
    $localVideo.hide();
    $('.local-view .avatar-img').show();
    
    $doctorVideo[0].pause();
    $doctorVideo.hide();
    $('.remote-view .avatar-img').show();
    $doctorLoader.hide();
    
    // Update UI
    resetSessionButton();
    
    deactivateControls();
    $reviewSection.slideDown();
    state.isSessionActive = false;
  }

  function resetSessionButton() {
    $sessionBtn.html(`
      <svg class="icon" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
      </svg>
      <span>Join Session with Dr. Helen</span>
    `).removeClass('active').prop('disabled', false);
  }

  // Audio Control
  function initAudio() {
    try {
      if (!state.stream) {
        console.warn("No stream available for audio initialization");
        return;
      }
      
      // Check if audio tracks are available
      const audioTracks = state.stream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.warn("No audio tracks in the stream");
        return;
      }

      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn("Web Audio API not supported");
        return;
      }
      
      state.audioContext = new AudioContext();
      state.gainNode = state.audioContext.createGain();
      
      const source = state.audioContext.createMediaStreamSource(state.stream);
      source.connect(state.gainNode);
      state.gainNode.connect(state.audioContext.destination);
      
      // Initialize volume
      updateVolume.call($volumeSlider[0]); // Trigger with current slider value
      
    } catch (error) {
      console.error("Audio setup failed:", error);
    }
  }

  function updateVolume() {
    const volume = $(this).val();
    
    // Update audio gain if available
    if (state.gainNode) {
      try {
        state.gainNode.gain.value = volume / 100;
      } catch (e) {
        console.warn("Failed to update volume:", e);
      }
    }
    
    // Update visual feedback
    $volumeLevel.css('width', `${volume}%`);
    
    // Dynamic color (blue to purple)
    const hue = 200 + (volume * 1.6);
    $volumeLevel.css('background', `hsl(${hue}, 80%, 60%)`);
  }

  // Control Toggles
  function toggleMicrophone() {
    if (state.stream) {
      const audioTracks = state.stream.getAudioTracks();
      if (audioTracks.length > 0) {
        const isActive = !$micBtn.hasClass('active');
        audioTracks[0].enabled = isActive;
        $micBtn.toggleClass('active');
      }
    }
  }

  function toggleCamera() {
    if (state.stream) {
      const videoTracks = state.stream.getVideoTracks();
      if (videoTracks.length > 0) {
        const isActive = !$cameraBtn.hasClass('active');
        videoTracks[0].enabled = isActive;
        $cameraBtn.toggleClass('active');
      }
    }
  }

  function toggleView() {
    $('.video-call-container').toggleClass('swap-views');
  }

  // Activate Controls
  function activateControls() {
    $micBtn.prop('disabled', false).addClass('active');
    $cameraBtn.prop('disabled', false).addClass('active');
    $swapBtn.prop('disabled', false);
    $volumeSlider.prop('disabled', false);
  }

  function deactivateControls() {
    $micBtn.prop('disabled', true).removeClass('active');
    $cameraBtn.prop('disabled', true).removeClass('active');
    $swapBtn.prop('disabled', true);
    $volumeSlider.prop('disabled', true);
  }

  // Rating System
  function rateQuestion() {
    const $stars = $(this).parent().children();
    const value = $(this).data('value');
    
    $stars.removeClass('active');
    $stars.each(function(index) {
      if (index < value) {
        $(this).addClass('active');
      }
    });
  }

  // Cleanup
  $(window).on('beforeunload', function() {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }
    if (state.audioContext && state.audioContext.state !== 'closed') {
      state.audioContext.close();
    }
  });
});

 // Submit review handler
  $('.submit-btn').on('click', function() {
    // Collect star ratings
    const ratings = {};
    $('.rating-stars').each(function() {
      const questionId = $(this).data('question');
      const rating = $(this).find('.active').length;
      ratings[`question_${questionId}`] = rating;
    });
    
    // Collect help options
    const helpOptions = [];
    $('input[name="help-type"]:checked').each(function() {
      helpOptions.push($(this).val());
    });
    
    // Create review object
    const review = {
      ratings: ratings,
      helpOptions: helpOptions,
      timestamp: new Date().toISOString()
    };
    
    console.log('Submitting review:', review);
    
    // In a real app, you would send this to your server
    // $.post('/api/reviews', review, function(response) {
    //   showThankYouMessage();
    // });
    
    // For demo purposes:
    showPopup("Review Session",'Thank you for your feedback! Your review has been submitted.',"success");
 //   alert('Thank you for your feedback! Your review has been submitted.');
    $('.review-section').slideUp();
  });


  var $slider = $('.slider');
    var $slides = $('.slide');
    var slideCount = $slides.length;
    var currentSlide = 0;
    
    // Auto-rotate slides every 5 seconds
    //var slideInterval = setInterval(nextSlide, 5000);
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slideCount;
        $slider.css('transform', 'translateX(-' + (currentSlide * 100) + '%)');
        setTimeout(nextSlide,10000);
    }
    setTimeout(nextSlide,10000);
   
    $('.play-btn').click(function() {
    $(this).toggleClass('playing');
    // Here you would add actual audio playback functionality
    // For example: new Audio('forest-sounds.mp3').play();
  }); 
 
 
   // Create audio element
  const audio = [
    new Audio('sounds/soothing_sound.mp3'),
    new Audio('sounds/rain_sound.mp3')
    ];
  
  // Play button functionality
  $('.play-btn-soundscape').click(function() {
      let controls = $(this).closest('.soundscape-controls');
      let id = $(this).data('id');
    audio[id].play();
    audio[id].loop = true;
    $(controls).find('.play-btn-soundscape').hide();
    $(controls).find('.pause-btn-soundscape, .stop-btn-soundscape').show();
  });
  
  // Pause button functionality
  $('.pause-btn-soundscape').click(function() {
      let controls = $(this).closest('.soundscape-controls');
      let id = $(this).data('id');
    audio[id].pause();
    $(controls).find('.pause-btn-soundscape').hide();
    $(controls).find('.play-btn-soundscape').show();
  });
  
  // Stop button functionality
  $('.stop-btn-soundscape').click(function() {
      let controls = $(this).closest('.soundscape-controls');
      let id = $(this).data('id');
    audio[id].pause();
    audio[id].currentTime = 0;
    $(controls).find('.pause-btn-soundscape, .stop-btn-soundscape').hide();
    $(controls).find('.play-btn-soundscape').show();
  });

var map;
var mapLayers = {};

const markerStyles = {
  park: {
    icon: 'tree',
    color: '#4CAF50',
    className: 'park-marker'
  },
  garden: {
    icon: 'seedling',
    color: '#8BC34A',
    className: 'garden-marker'
  },
  sunset: {
    icon: 'sun',
    color: '#FF9800',
    className: 'sunset-marker'
  },
  zoo: {
    icon: 'paw',
    color: '#795548',
    className: 'zoo-marker'
  },
  forest: {
    icon: 'mountain-sun',
    color: '#388E3C',
    className: 'forest-marker'
  },
  library: {
    icon: 'book-open',
    color: '#607D8B',
    className: 'library-marker'
  },
  art: {
    icon: 'palette',
    color: '#9C27B0',
    className: 'art-marker'
  },
  clinic: {
    icon: 'heart-pulse',
    color: '#F44336',
    className: 'clinic-marker'
  },
  cafe: {
    icon: 'mug-saucer',
    color: '#795548',
    className: 'cafe-marker'
  },
  yoga: {
    icon: 'person-praying',
    color: '#2196F3',
    className: 'yoga-marker'
  }
};
var filters = {};
const organicShapes = {
    greenspaces: [
        // 1. Aristotle University Campus
        [
            ['M', [40.64079098062354, 22.97404289245606]],
            ['Q', [40.641116624810756, 22.974901199340824], [40.6430053297684, 22.98425674438477], [40.63838116426354, 22.99944877624512],
                [40.62854560636587, 23.01095008850098], [40.614473680534935, 23.011808395385746], [40.61753587970251, 23.00408363342285],
                [40.61603737424187, 22.988290786743164], [40.62874102890735, 22.980651855468754], [40.637925243274374, 22.972497940063477],
                [40.64079098062354, 22.97404289245606], 'Z']
        ],
        // 2. Seich Sou Forest (northern hills)
        [
            ['M', [40.64919209240809, 22.98974990844727]],
            ['Q', [40.65782004039719, 22.9689359664917], [40.657168913435775, 22.978119850158695], [40.653685276243216, 22.98593044281006],
                [40.64867112398461, 22.989406585693363], [40.64632671574881, 22.98348426818848], [40.64482885625898, 22.979750633239746],
                [40.645317292395006, 22.973613739013675],[40.64788966372356, 22.969837188720707],[40.654173647559766, 22.967948913574222],
                [40.64919209240809, 22.98974990844727], 'Z']
        ],
        // 3. Pedion tou Areos Park
        [
            ['M', [40.66498201752915, 22.954216003417972]],
            ['Q', [40.66488435937626, 22.9564905166626], [40.663826386887486, 22.95767068862915], [40.66273584383448, 22.958679199218754],
                [40.662149873038814, 22.958121299743652], [40.662784674501765, 22.956962585449222], [40.66317531855301, 22.95567512512207],
                [40.66451000179875, 22.95470952987671], 'Z']
        ],
        // 4. Nea Paralia Waterfront Park
        [
            ['M', [40.621966047086744, 22.956683635711673]],
            ['Q', [40.621949760244746, 22.955074310302738], [40.622650090864596, 22.954623699188232],[40.62294325033922, 22.9559326171875],[40.622666377535836, 22.95623302459717],
                [40.621966047086744, 22.956683635711673], 'Z']
        ]
    ],
    cleanair: [
        // 1. Port Area
        [
            ['M', [40.619360101853964, 22.95181274414063]],
            ['Q', [40.61896920130073, 22.95378684997559], [40.61056428615614, 22.952671051025394], [40.60815337894158, 22.949838638305668],
                [40.61870859966114, 22.951297760009766], [40.619360101853964, 22.95181274414063], 'Z']
        ],
        // 2. Thermi Industrial Area (clean air initiative zone)
        [
            ['M', [40.63727392217427, 23.002109527587894]],
            ['Q', [40.61649344467927, 23.02820205688477], [40.61838284618208, 23.012151718139652], [40.62222663601859, 22.993783950805664],
                [40.632519085637355,  23.004770278930668], [40.63727392217427, 23.002109527587894], 'Z']
        ]
    ],
    sunlight: [
        // 1. Rotunda Area
        [
            ['M', [40.633, 22.952]],
            ['Q', [40.635, 22.955], [40.638, 22.953], [40.637, 22.950],
                [40.634, 22.948], [40.632, 22.950], [40.633, 22.952], 'Z']
        ],
        // 2. Ano Poli (Upper Town)
        [
            ['M', [40.643, 22.955]],
            ['Q', [40.645, 22.958], [40.648, 22.957], [40.649, 22.953],
                [40.646, 22.951], [40.642, 22.952], [40.641, 22.955],
                [40.643, 22.955], 'Z']
        ],
        // 3. Kalamaria District
        [
            ['M', [40.585, 22.960]],
            ['Q', [40.587, 22.963], [40.590, 22.962], [40.591, 22.958],
                [40.588, 22.956], [40.584, 22.957], [40.583, 22.960],
                [40.585, 22.960], 'Z']
        ],
        // 4. Thessaloniki Concert Hall Area
        [
            ['M', [40.625, 22.970]],
            ['Q', [40.627, 22.973], [40.630, 22.972], [40.631, 22.968],
                [40.628, 22.966], [40.624, 22.967], [40.623, 22.970],
                [40.625, 22.970], 'Z']
        ]
    ],
    clearsky: [
        // 1. Thermaic Gulf Coastline
        [
            ['M', [40.64000942809261, 22.900915145874027]],
            ['Q', [40.63264935964309, 22.91919708251953], [40.62880616962743, 22.939109802246097], [40.62111912603713, 22.948379516601566],
                [40.60750176746648, 22.943229675292972], [40.603396469077374, 22.951126098632812], [40.62554905578553, 22.951383590698242],
                [40.636231795196885,22.93284416198731],[40.640856109588064,22.923231124877933],[40.642809948975234,22.90349006652832],
                [40.64000942809261, 22.900915145874027], 'Z']
        ],
        // 2. Airport Area (open skies)
        [
            ['M', [40.520, 22.990]],
            ['Q', [40.522, 22.993], [40.525, 22.992], [40.526, 22.988],
                [40.523, 22.986], [40.519, 22.987], [40.518, 22.990],
                [40.520, 22.990], 'Z']
        ]
    ]
};

// Function to create curved shapes
function createCurvedShape(path, style) {
    // Collect all path commands in the required format
    const curvePath = [];
    
    path.forEach(segment => {
        // The first element is the command (M, C, S, etc.)
        curvePath.push(segment[0]); 
        // The remaining elements are coordinates
        curvePath.push(...segment.slice(1));
    });
    
    // Create the curve with the complete path
    return new L.Curve(curvePath, style);
}

// Configuration
const ROUTE_STYLE = {
    car: { color: '#9c27b0', weight: 5, opacity: 0.8 },
    walk: { color: '#7b1fa2', weight: 3, dashArray: '5, 5' },
    bicycle: { color: '#9d3bc7', weight: 4, dashArray: '10, 5' }
};

// Variables for directions flow
let directionsOriginMarker = null;
let directionsRouteLayer = null;
let currentTransportMode = 'car';
let directionsPopup = null;
let instructionsPopup = null;
let savedOrigin = null;
// Start directions flow (for setting new origin)
function startDirectionsFlow(destination) {
    clearDirections();
 // Get map bounds to position at top
    const bounds = map.getBounds();
    const topCenter = L.latLng(
        bounds.getNorth() - 0.1 * (bounds.getNorth() - bounds.getSouth()),
        map.getCenter().lng
    );
    
    directionsPopup = L.popup()
        .setLatLng(topCenter)
        .setContent(`
            <div class="directions-instructions">
                <h3><i class="fas fa-route" style="color: #9c27b0"></i> Set Origin Point</h3>
                <p>Click on the map to set your starting location</p>
                <div class="transport-modes">
                    <button class="transport-btn ${currentTransportMode === 'car' ? 'active' : ''}" data-mode="car">
                        <i class="fas fa-car"></i> Drive
                    </button>
                    <button class="transport-btn ${currentTransportMode === 'walk' ? 'active' : ''}" data-mode="walk">
                        <i class="fas fa-walking"></i> Walk
                    </button>
                </div>
            ${savedOrigin ? `
            <div class="saved-origin">
                <i class="fas fa-info-circle"></i> Using saved origin
                <button class="change-origin-btn">(change)</button>
            </div>` : ''}
        </div>
                <button class="cancel-btn">Cancel</button>
            </div>
        `)
        .openOn(map);

    map.once('click', function(e) {
        directionsPopup.remove();
        savedOrigin = e.latlng; // Save the new origin
        calculateOSRMRoute(savedOrigin, destination, currentTransportMode);
    });

    // Transport mode switcher
    document.querySelectorAll('.transport-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentTransportMode = this.dataset.mode;
            directionsPopup.setContent(directionsPopup.getContent());
        });
    });

    // Use saved origin button
    document.querySelector('.use-saved-origin-btn')?.addEventListener('click', function() {
        directionsPopup.remove();
        calculateOSRMRoute(savedOrigin, destination, currentTransportMode);
    });

    // Cancel button
    document.querySelector('.cancel-btn')?.addEventListener('click', function() {
        directionsPopup.remove();
        map.off('click');
    });
}
function clearRoute() {
    if (directionsRouteLayer) {
        map.removeLayer(directionsRouteLayer);
        directionsRouteLayer = null;
    }
}
// Clear ALL direction-related elements
function clearAllDirections() {
savedOrigin = null;
    // Remove route line if exists
    if (directionsRouteLayer) {
        map.removeLayer(directionsRouteLayer);
        directionsRouteLayer = null;
    }
    
    // Remove origin marker if exists
    if (directionsOriginMarker) {
        map.removeLayer(directionsOriginMarker);
        directionsOriginMarker = null;
    }
    
    // Close any open direction popups
    if (directionsPopup) {
        map.removeLayer(directionsPopup);
        directionsPopup = null;
    }
    
    if (instructionsPopup) {
        map.removeLayer(instructionsPopup);
        instructionsPopup = null;
    }
    $('.leaflet-popup').hide();
}
document.getElementById('clear-directions').addEventListener('click', clearAllDirections);



// Calculate route using free OSRM service
async function calculateOSRMRoute(origin, destination, profile = 'car') {
    const profileParam = 
        profile === 'walk' ? 'foot' :
        profile === 'bicycle' ? 'bike' :
        'driving';
    const loadingPopup = L.popup()
        .setLatLng(map.getCenter())
        .setContent('<div class="loading-directions"><i class="fas fa-spinner fa-spin"></i> Calculating route...</div>')
        .openOn(map);

    try {
        const response = await fetch(
            `https://router.project-osrm.org/route/v1/${profileParam}/` +
            `${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.code !== 'Ok') throw new Error(data.message);
        
          clearRoute();

        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

        // Draw route
        directionsRouteLayer = L.polyline(coordinates, ROUTE_STYLE[profile]).addTo(map);

        // Add origin marker
        directionsOriginMarker = L.marker(origin, {
            icon: L.divIcon({
                html: `<i class="fas fa-map-marker-alt" style="color: ${ROUTE_STYLE[profile].color}; font-size: 24px;"></i>`,
                className: 'origin-marker'
            })
        }).addTo(map);

        // Show instructions
        showRouteInstructions(route, origin, profile);

        // Fit bounds
        map.fitBounds(L.latLngBounds(coordinates));

    } catch (error) {
        console.error('Routing error:', error);
        L.popup()
            .setLatLng(map.getCenter())
            .setContent('<div class="error-message">Could not calculate route. Please try again.</div>')
            .openOn(map);
    } finally {
        loadingPopup.remove();
    }
}

function showRouteInstructions(route, origin, profile) {
    const steps = route.legs[0].steps;
    const instructions = steps.map((step, i) => `
        <div class="route-step ${i === 0 ? 'first-step' : ''}">
            <i class="direction-icon ${getDirectionIcon(step)}"></i>
            <div class="step-text">${step.maneuver.instruction}</div>
            <div class="step-distance">${(step.distance / 1000).toFixed(1)} km</div>
        </div>
    `).join('');

    L.popup()
        .setLatLng(origin)
        .setContent(`
            <div class="route-instructions">
                <h4><i class="fas fa-list-ol" style="color: ${ROUTE_STYLE[profile].color}"></i> Directions</h4>
                <div class="steps-list">${instructions}</div>
                <div class="route-summary">
                    <div><i class="fas fa-road"></i> ${(route.distance / 1000).toFixed(1)} km</div>
                    <div><i class="fas fa-clock"></i> ${formatDuration(route.duration)}</div>
                </div>
            </div>
        `)
        .openOn(map);
}

// Helper functions
function getDirectionIcon(step) {
    const type = step.maneuver.type;
    const modifier = step.maneuver.modifier || '';
    
    if (type === 'depart') return 'fas fa-map-marker-alt';
    if (type === 'arrive') return 'fas fa-flag-checkered';
    if (type.includes('turn')) {
        if (modifier.includes('left')) return 'fas fa-arrow-turn-left';
        if (modifier.includes('right')) return 'fas fa-arrow-turn-right';
        return 'fas fa-arrow-right';
    }
    if (type === 'roundabout') return 'fas fa-undo';
    return 'fas fa-arrow-up';
}

function formatDuration(seconds) {
    const mins = Math.round(seconds / 60);
    return mins > 60 ? 
        `${Math.floor(mins / 60)}h ${mins % 60}m` : 
        `${mins} min`;
}

// Clear directions but keep origin saved
function clearDirections() {
    if (directionsRouteLayer) map.removeLayer(directionsRouteLayer);
    if (directionsOriginMarker) map.removeLayer(directionsOriginMarker);
    directionsRouteLayer = null;
    directionsOriginMarker = null;
}




function createWellnessMarker(lat, lng, type, title,location) {
  const style = markerStyles[type];
  
  // Create custom HTML marker
  const icon = L.divIcon({
    className: `wellness-marker ${style.className}`,
    html: `<i class="fa-solid fa-${style.icon}"></i>`,
    iconSize: [32, 32],
    popupAnchor: [0, -16]
  });




  // Add marker to map
  const marker = L.marker([lat, lng], { icon })
    .addTo(map)
    .bindPopup(`
  <h4>${location.name}</h4>
  <p><i class="fas fa-map-marker-alt"></i> ${location.address}</p>
  <p><i class="fas fa-clock"></i> ${location.hours}</p>
  <p>${location.description}</p>
  <div class="wellness-tip">${location.tip}</div>
  <p style="display:none"><i class="fas fa-euro-sign"></i> <strong>${location.priceIcon}</strong></p>
 <div class="directions-options">
                <a href="#" class="directions-btn car" data-mode="car">
                    <i class="fas fa-car" style="color: ${ROUTE_STYLE.car.color}"></i> Drive
                </a>
                <a href="#" class="directions-btn bicycle" data-mode="bicycle">
                    <i class="fas fa-bicycle" style="color: ${ROUTE_STYLE.bicycle.color}"></i> Bike
                </a>
                <a href="#" class="directions-btn walk" data-mode="walk">
                    <i class="fas fa-walking" style="color: ${ROUTE_STYLE.walk.color}"></i> Walk
                </a>
            </div>
`);
 marker.on('popupopen', function() {
        document.querySelectorAll('.directions-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                currentTransportMode = this.dataset.mode;
                
                // Clear any existing route first
                clearRoute();
                
                // If we have a saved origin, use it immediately
                if (savedOrigin && !e.ctrlKey) { // Hold Ctrl to force new origin
                    calculateOSRMRoute(savedOrigin, marker.getLatLng(), currentTransportMode);
                } else {
                    startDirectionsFlow(marker.getLatLng());
                }
            });
        });

        // Change origin button handler
        document.querySelector('.change-origin-btn')?.addEventListener('click', function(e) {
            e.preventDefault();
           clearRoute();
            startDirectionsFlow(marker.getLatLng());
        });
    });
  // Add dynamic styling
  const element = marker.getElement();
  if (element) {
    element.style.backgroundColor = style.color;
    element.querySelector('i').style.color = 'white';
  }

  return marker;
}
function initMap() {
    // Initialize map centered on Ioannina, Greece
    // Initialize map with zoom/bounds restrictions
    map = L.map('map', {
      minZoom: 12,
      maxZoom: 18,
    }).setView([40.6401, 22.9444], 14);
    
const thessaloniki = L.latLng(40.6401, 22.9444);
const radiusInDegrees = 0.1; // ~5km in degrees

const southWest = L.latLng(
  thessaloniki.lat - radiusInDegrees,
  thessaloniki.lng - radiusInDegrees
);
const northEast = L.latLng(
  thessaloniki.lat + radiusInDegrees,
  thessaloniki.lng + radiusInDegrees
);
const maxBounds = L.latLngBounds(southWest, northEast);


// Add this to prevent users from dragging too far
map.setMaxBounds(maxBounds);
    
    // Reset view if users try to pan outside bounds
    map.on('drag', function() {
      if (!maxBounds.contains(map.getCenter())) {
        map.panInsideBounds(maxBounds, { animate: true });
      }
    });
    

    
    // Add OpenStreetMap tiles with a lighter color scheme
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    

    
    // Create map layers for our filters
    mapLayers.dvi = L.layerGroup().addTo(map);
    mapLayers.air = L.layerGroup().addTo(map);
    mapLayers.sun = L.layerGroup().addTo(map);
    mapLayers.sky = L.layerGroup().addTo(map);
    
    // Add sample areas for each filter
    addSampleAreas();
    
    // Initially hide all layers
    mapLayers.dvi.remove();
    mapLayers.air.remove();
    mapLayers.sun.remove();
    mapLayers.sky.remove();
}

function addSampleAreas() {
filters={
    'greenspaces': {
        name: 'Green Spaces',
        icon: 'tree',
        layer: new L.LayerGroup(),
        description:"<b>Central Green Zone</b><br>High vegetation density area",
        style: { color: '#2E7D32', fillOpacity: 0.3, fill:true, dashArray: '3,3', weight: 1 }
    },
    'cleanair': {
        name: 'Clean Air',
        icon: 'wind',
        layer: new L.LayerGroup(),
        description: "<b>Clean Air Corridor</b><br>Low PM2.5 levels",
        style: { color: '#0288D1', fillOpacity: 0.3, fill:true, dashArray: '3,3', weight: 1 }
    },
    'sunlight': {
        name: 'Sunlight View',
        icon: 'sun',
        layer: new L.LayerGroup(),
        description: "<b>Sunlight Basin</b><br>Unobstructed solar exposure",
        style: { color: '#F57F17', fillOpacity: 0.3, fill:true, dashArray: '3,3', weight: 1 }
    },
    'clearsky': {
        name: 'Clear Sky',
        icon: 'cloud',
        layer: new L.LayerGroup(),
        description: "<b>Clear Sky Zone</b><br>Low light pollution area",
        style: { color: '#546E7A', fillOpacity: 0.3, fill:true, dashArray: '3,3', weight: 1 }
    }
};
// Add shapes to layers
$.each(filters,function(key,filter){
    let array = organicShapes[key];
    $.each(array,function(index,data){
        try{
        const shape = createCurvedShape(data, filter.style);
        console.log(shape);
        shape.bindPopup(filter.description).addTo(filter.layer);
        filter.layer.addTo(map);
        map.removeLayer(filter.layer);
        }
        catch (error) {
        //console.error(error);
        }
    });
});

    

     // Initialize markers layer
    const wellnessLocations = L.layerGroup().addTo(map);   
    // Add markers in bulk
const locations = [
  // 1. Park
  {
    lat: 40.623790148260504,
    lng: 22.951297760009766,
    type: "park",
    name: "Nea Paralia Waterfront Park",
    address: "Leof. Nikis, Thessaloniki 546 40",
    hours: "Open 24/7",
    description: "A beautiful 5km waterfront promenade perfect for walking meditation with stunning views of the Thermaic Gulf. Features shaded seating areas and sunrise/sunset observation points.",
    tip: "Early mornings are ideal for peaceful reflection with local fishermen",
    price: "Free",
    priceIcon: "Free"
  },

  // 2. Community Garden
  {
    lat: 40.6320,
    lng: 22.9580,
    type: "garden",
    name: "Municipal Urban Garden of Thessaloniki",
    address: "Egnatia 154, Thessaloniki 546 36",
    hours: "Daily 8:00 AM - 8:00 PM",
    description: "Community garden with organic vegetable plots and aromatic herb gardens. Offers weekly mindfulness gardening workshops and herbal tea tasting sessions.",
    tip: "Visit during the weekly farmers' market for fresh local produce",
    price: "Free",
    priceIcon: "Free"
  },

  // 3. Sunset Viewpoint
  {
    lat: 40.6264,
    lng: 22.9484,
    type: "sunset",
    name: "Thessaloniki White Tower Rooftop",
    address: "Leof. Nikis, Thessaloniki 546 21",
    hours: "8:00 AM - 8:00 PM (Summer until 10:00 PM)",
    description: "Iconic landmark offering panoramic views of the city and sea. The rooftop provides one of the best sunset views in Thessaloniki with historical context.",
    tip: "Visit 1 hour before closing for fewer crowds and golden light",
    price: "€6",
    priceIcon: "€6"
  },

  // 4. Animal Sanctuary
  {
    lat: 40.5950,
    lng: 22.9500,
    type: "zoo",
    name: "Thessaloniki Animal Shelter",
    address: "Industrial Area of Thessaloniki, 564 29",
    hours: "Mon-Sat 10:00 AM - 4:00 PM",
    description: "Shelter offering animal-assisted therapy sessions with rescued dogs and cats. Their 'Paws for Peace' program helps reduce stress through guided interactions.",
    tip: "Call ahead to schedule a therapy session",
    price: "Donation-based",
    priceIcon: "Suggested €5-10 donation"
  },

  // 5. Forest Bathing
  {
    lat: 40.62489761395496,
    lng: 23.008460998535156,
    type: "forest",
    name: "Seich Sou Forest National Park",
    address: "Thessaloniki 546 36",
    hours: "Daily 6:00 AM - 8:00 PM",
    description: "Expansive urban forest with marked trails for forest bathing and nature therapy. Features viewpoints overlooking the city and designated meditation spots.",
    tip: "The 'Path of the Senses' trail is specially designed for mindfulness",
    price: "Free",
    priceIcon: "Free"
  },

  // 6. Library
  {
    lat: 40.6299,
    lng: 22.9519,
    type: "library",
    name: "Thessaloniki Municipal Library",
    address: "Vasilissis Olgas 198, Thessaloniki 546 42",
    hours: "Mon-Fri 8:00 AM - 8:00 PM, Sat 9:00 AM - 2:00 PM",
    description: "Quiet reading rooms with Mediterranean garden views. Hosts weekly mindfulness reading circles and has an extensive psychology/wellness collection.",
    tip: "The rooftop reading room has the best natural light",
    price: "Free",
    priceIcon: "Free"
  },

  // 7. Public Art
  {
    lat: 40.5983,
    lng: 22.9483,
    type: "art",
    name: "Thessaloniki Concert Hall Gardens",
    address: "25is Martiou 2, Thessaloniki 546 46",
    hours: "24/7",
    description: "Modern sculpture garden with sound installations and interactive art pieces. The open-air space combines art appreciation with peaceful contemplation.",
    tip: "Evening visits often include free outdoor musical performances",
    price: "Free",
    priceIcon: "Free"
  },

  // 8. Mental Health Clinic
  {
    lat: 40.6350,
    lng: 22.9360,
    type: "clinic",
    name: "Thessaloniki Center for Mental Health",
    address: "Tsimiski 136, Thessaloniki 546 22",
    hours: "Mon-Fri 8:00 AM - 8:00 PM",
    description: "Comprehensive mental health services including mindfulness-based therapy. Offers sliding-scale fees and group meditation sessions in their garden.",
    tip: "First consultation is free with appointment",
    price: "Sliding scale",
    priceIcon: "From €40/session"
  },

  // 9. Quiet Café
  {
    lat: 40.6340,
    lng: 22.9390,
    type: "cafe",
    name: "Mediterraneo Coffee & Books",
    address: "Proxenou Koromila 10, Thessaloniki 546 22",
    hours: "Mon-Sat 8:00 AM - 10:00 PM, Sun 10:00 AM - 6:00 PM",
    description: "Book café with dedicated quiet zones and a selection of mindfulness literature. Features specialty Greek herbal teas and a no-devices reading room.",
    tip: "Morning hours before 10am are the most peaceful",
    price: "€2-6",
    priceIcon: "€2-6"
  },

  // 10. Yoga Studio
  {
    lat: 40.63336586213132,
    lng: 22.954387664794925,
    type: "yoga",
    name: "Omilos Yoga Thessaloniki",
    address: "Mitropoleos 60, Thessaloniki 546 22",
    hours: "Mon-Fri 7:00 AM - 9:00 PM, Sat-Sun 9:00 AM - 2:00 PM",
    description: "Central yoga studio offering various styles including mindfulness yoga and meditation classes. Features sea-view practice rooms and experienced instructors.",
    tip: "Try their sunset yoga sessions with live music",
    price: "Drop-in €12",
    priceIcon: "Drop-in €12 / Packages available"
  },

  // 11. Community Garden
  {
    lat: 40.6400,
    lng: 22.9600,
    type: "garden",
    name: "Ano Poli Community Garden",
    address: "Ano Poli, Thessaloniki 546 34",
    hours: "Daily 9:00 AM - 7:00 PM",
    description: "A serene community garden in the upper town, offering panoramic views and a variety of native plants. Hosts weekly gardening workshops and mindfulness sessions.",
    tip: "Best visited during spring when flowers are in full bloom",
    price: "Free",
    priceIcon: "Free"
  },

  // 12. Café
  {
    lat: 40.6320,
    lng: 22.9440,
    type: "cafe",
    name: "To Pikap",
    address: "Olimpou 57, Thessaloniki 546 30",
    hours: "Mon-Sun 9:00 AM - 11:00 PM",
    description: "A cozy café and vinyl record store offering a relaxed atmosphere with a curated selection of music. Ideal for unwinding with a cup of coffee and good tunes.",
    tip: "Check their schedule for live acoustic sessions",
    price: "€3-7",
    priceIcon: "€3-7"
  },

  // 13. Café
  {
    lat: 40.6345,
    lng: 22.9425,
    type: "cafe",
    name: "To Kafeneio tou Kokkora",
    address: "Iktinou 4, Thessaloniki 546 22",
    hours: "Mon-Sun 8:00 AM - 12:00 AM",
    description: "Traditional Greek café with a modern twist, offering a variety of herbal teas and light snacks in a tranquil setting.",
    tip: "Their homemade lemon verbena tea is a must-try",
    price: "€2-5",
    priceIcon: "€2-5"
  },

  // 14. Library
  {
    lat: 40.6299,
    lng: 22.9519,
    type: "library",
    name: "Central Public Library of Thessaloniki",
    address: "Ethnikis Amynis 27, Thessaloniki 546 21",
    hours: "Mon-Fri 9:00 AM - 8:00 PM",
    description: "The main public library offering a vast collection of books and resources. Features quiet reading areas and hosts regular literary events.",
    tip: "Visit the top floor for a quiet study space with city views",
    price: "Free",
    priceIcon: "Free"
  },

  // 15. Library
  {
    lat: 40.6430,
    lng: 22.9510,
    type: "library",
    name: "Municipal Library of Ano Poli",
    address: "Krispou 7, Thessaloniki 546 34",
    hours: "Mon-Fri 9:00 AM - 5:00 PM",
    description: "Housed in a neoclassical building, offering a tranquil environment with curated wellness literature and open reading balconies overlooking the city.",
    tip: "Great spot for reflective journaling during weekdays",
    price: "Free",
    priceIcon: "Free"
  },
 // 16. Forest Trail
  {
    lat: 40.6511,
    lng: 22.9833,
    type: "forest",
    name: "Trail of the Pines – Seich Sou",
    address: "Seich Sou, Thessaloniki 546 36",
    hours: "Open 24/7",
    description: "A quiet forest trail ideal for shinrin-yoku (forest bathing). Surrounded by tall pines, with natural benches and bird-watching spots.",
    tip: "Bring a thermos of herbal tea and arrive just after sunrise for maximum tranquility",
    price: "Free",
    priceIcon: "Free"
  },

  // 17. Forest Rest Stop
  {
    lat: 40.63974890854887,
    lng: 22.964601516723636,
    type: "forest",
    name: "Forest Rest Point – Kedrinos Lofos",
    address: "Kedrinos Lofos, Thessaloniki 546 34",
    hours: "Open 24/7",
    description: "Open-air rest area within the pine forest of Kedrinos Lofos, offering natural seating, panoramic city views, and ideal spots for meditation or journaling.",
    tip: "Bring a mat for seated meditation under the pines",
    price: "Free",
    priceIcon: "Free"
  },

  // 18. Yoga Studio
  {
    lat: 40.63877195120459,
    lng: 22.944860458374023,
    type: "yoga",
    name: "Yogalign Studio",
    address: "Ioanni Koletti 25, Thessaloniki 546 27",
    hours: "Mon-Fri 7:00 AM - 9:00 PM, Sat 10:00 AM - 3:00 PM",
    description: "Bright, peaceful yoga studio offering mindfulness-based Hatha and Vinyasa yoga classes. Occasional silent retreats and breathing workshops.",
    tip: "Ask for the ‘Silent Morning’ drop-in pass for a meditative session",
    price: "€10 per session",
    priceIcon: "€10"
  },

  // 19. Mental Health & Mindfulness Center
  {
    lat: 40.63212826209512,
    lng: 22.948637008666996,
    type: "clinic",
    name: "Mindful Path Center",
    address: "Papanastasiou 120, Thessaloniki 544 53",
    hours: "Mon-Fri 9:00 AM - 8:00 PM",
    description: "Private center offering mindfulness-based stress reduction (MBSR), guided meditation, and therapy in tranquil rooms with garden access.",
    tip: "Book a free introductory session on Tuesdays",
    price: "€30-60/session",
    priceIcon: "€30-60"
  },

  // 20. Art Meditation Space
  {
    lat: 40.61779648591683,
    lng: 22.952671051025394,
    type: "art",
    name: "Zen Color Studio",
    address: "Agapinou 9, Thessaloniki 546 35",
    hours: "Mon-Sat 11:00 AM - 7:00 PM",
    description: "Creative art studio offering mindful coloring, mandala creation, and therapeutic art journaling sessions. Calm ambient music and herbal infusions provided.",
    tip: "Great for rainy days – check their weekend mindfulness art events",
    price: "€5-15",
    priceIcon: "€5-15"
  }
];
 
map.on('click', function(e) {
    // e.latlng contains the coordinates of the click
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    
    // Log to console
    console.log(`Lat: ${lat}, Long: ${lng}`);
});
    
    locations.forEach(loc => {
      createWellnessMarker(loc.lat, loc.lng, loc.type, loc.name,loc)
        .addTo(wellnessLocations);
    });
}

function toggleMapFilter(filter) {
    if (mapLayers[filter].hasLayer(map)) {
        mapLayers[filter].remove();
    } else {
        mapLayers[filter].addTo(map);
    }
}

function showMeditationModal(minutes) {
    
    console.log(`Starting ${minutes} minute meditation`);
    showPopup("Quick start session",`Starting ${minutes} minute meditation session`,"default");
    // alert(`Starting ${minutes} minute meditation session`);
}

function showPlayerModal(title) {
    console.log(`Playing session: ${title}`);
    alert(`Now playing: ${title}`);
}


            const $introButton = $('.ai-chat-intro');
            const $popup = $('.ai-chat-intro-popup');
            const $overlay = $('.popup-overlay');
            const $closeButton = $('.popup-close');

            // Open popup
            $introButton.on('click', function(e) {
                const buttonRect = e.target.getBoundingClientRect();
                
                $popup.addClass('show');
                $overlay.addClass('show');
            });

            // Close popup
            function closePopup() {
                $popup.removeClass('show');
                $overlay.removeClass('show');
            }

            $closeButton.on('click', closePopup);
            $overlay.on('click', closePopup);

            // Close with Escape key
            $(document).on('keydown', function(e) {
                if (e.key === 'Escape') {
                    closePopup();
                }
            });
            
// Store original items for resetting
  const $originalItems = $('.meditation-item');
  
  // Toggle filter panel
  $('.meditation-filter-btn').on('click', function() {
    $('.meditation-filter-panel').slideToggle(200);
  });
  
  // Initialize filter options from data attributes
  const purposes = [];
  const types = [];
  
  $originalItems.each(function() {
    const purpose = $(this).data('purpose');
    const type = $(this).data('type');
    
    if (!purposes.includes(purpose)) purposes.push(purpose);
    if (!types.includes(type)) types.push(type);
  });
  
  // Add purpose filter options
  const purposeOptions = $('.meditation-filter-group:nth-child(2) .meditation-filter-options');
  purposes.forEach(purpose => {
    purposeOptions.append(
      `<button class="meditation-filter-option" data-filter="purpose" data-value="${purpose}">${purpose}</button>`
    );
  });
  
  // Add type filter options
  const typeOptions = $('.meditation-filter-group:nth-child(3) .meditation-filter-options');
  types.forEach(type => {
    typeOptions.append(
      `<button class="meditation-filter-option" data-filter="type" data-value="${type}">${type}</button>`
    );
  });
  
  // Active filter tracking
  const activeFilters = {
    duration: null,
    purpose: null,
    type: null
  };
  
  // Filter option click handler
  $(document).on('click', '.meditation-filter-option', function() {
    const $this = $(this);
    const filterType = $this.data('filter') || 'duration';
    const filterValue = $this.data('value') || $this.data('duration');
    
    // Toggle active state
    if (activeFilters[filterType] === filterValue) {
      // Remove filter
      $this.removeClass('active');
      activeFilters[filterType] = null;
    } else {
      // Apply new filter
      $this.siblings().removeClass('active');
      $this.addClass('active');
      activeFilters[filterType] = filterValue;
    }
    
    applyFilters();
  });
  
  // Apply filters function
  function applyFilters() {
    // First reset all items to original state
    $('.meditation-grid').empty();
    $originalItems.detach().show();
    
    // If no filters are active, show all items
    if (!activeFilters.duration && !activeFilters.purpose && !activeFilters.type) {
      rebuildGrid($originalItems);
      return;
    }
    
    // Filter items based on active filters
    const $filteredItems = $originalItems.filter(function() {
      const $item = $(this);
      let matches = true;
      
      // Check duration filter
      if (activeFilters.duration) {
        const duration = $item.data('duration');
        matches = matches && (
          (activeFilters.duration === 'short' && duration === 'short') ||
          (activeFilters.duration === 'medium' && duration === 'medium') ||
          (activeFilters.duration === 'long' && duration === 'long')
        );
      }
      
      // Check purpose filter
      if (activeFilters.purpose) {
        matches = matches && ($item.data('purpose') === activeFilters.purpose);
      }
      
      // Check type filter
      if (activeFilters.type) {
        matches = matches && ($item.data('type') === activeFilters.type);
      }
      
      return matches;
    });
    
    // Rebuild grid with filtered items
    rebuildGrid($filteredItems);
  }
  
  // Rebuild grid with proper rows
  function rebuildGrid($items) {
    const $grid = $('.meditation-grid');
    let $currentRow = $('<div class="meditation-grid-row"></div>').appendTo($grid);
    
    $items.each(function(index) {
      if (index > 0 && index % 4 === 0) {
        $currentRow = $('<div class="meditation-grid-row"></div>').appendTo($grid);
      }
      $(this).appendTo($currentRow);
    });
    
    // Add placeholders to incomplete rows
    $('.meditation-grid-row').each(function() {
      const itemsInRow = $(this).children('.meditation-item').length;
      if (itemsInRow < 4) {
        for (let i = itemsInRow; i < 4; i++) {
          $(this).append('<div class="meditation-item-placeholder"></div>');
        }
      }
    });
  }
  
  // Initialize the grid
  applyFilters();



 $('input[type="checkbox"],input[type="radio"]').bind('change', function (v) {
        let label = $(this).closest('label');
        let isFeeling = $(label).hasClass('mood-option');
        if(isFeeling){
            $('.mood-option').not(label).removeClass('selected');
        }
        if($(this).is(':checked')) {
            $(label).addClass('selected');
        } else {
            
            $(label).removeClass('selected');
        }
    });

document.querySelector('.mood-journal').addEventListener('input', function() {
  document.getElementById('mood-char-count').textContent = this.value.length;
});

document.querySelector('.mood-submit').addEventListener('click', function() {
  document.getElementById('mood-form').classList.add('hidden');
  document.getElementById('mood-success').classList.remove('hidden');
  
  // In a real app, you would submit the data here
  const formData = {
    mood: document.querySelector('input[name="mood"]:checked')?.value,
    feelings: Array.from(document.querySelectorAll('input[name="feelings"]:checked')).map(el => el.value),
    triggers: Array.from(document.querySelectorAll('input[name="triggers"]:checked')).map(el => el.value),
    thoughts: document.querySelector('.mood-journal').value
  };
  console.log('Submitted:', formData);
});




function showPopup(title, message, type = 'default') {
  // Create popup HTML
  const popupHTML = `
    <div class="popup-overlay-messages">
      <div class="popup-container popup-${type}">
        <div class="popup-header">
          <div class="popup-title">
            <i class="popup-icon"></i>
            ${title}
          </div>
          <div class="popup-close">&times;</div>
        </div>
        <div class="popup-body">${message}</div>
      </div>
    </div>
  `;

  // Add to body
  $('body').append(popupHTML);

  // Close handler
  $('.popup-overlay-messages, .popup-close').click(function() {
    $('.popup-overlay-messages').remove();
  });

  // Prevent closing when clicking popup content
  $('.popup-container').click(function(e) {
    e.stopPropagation();
  });
}