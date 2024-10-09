const apiKey = 'AIzaSyAbHeWC_oUp7DUisor9O7hZ5tgRbgb2zVU'; // Replace with your actual YouTube API key
let queue = [];
let currentIndex = -1; // Track the current video index in the queue

document.getElementById('searchBtn').addEventListener('click', async () => {
    const songName = document.getElementById('songInput').value;
    if (songName) {
        const videos = await fetchKaraokeVideos(songName);
        displayVideos(videos);
    }
});

async function fetchKaraokeVideos(songName) {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=karaoke%20${encodeURIComponent(songName)}&type=video&key=${apiKey}`);
    
    if (!response.ok) {
        console.error('Error fetching videos:', response.statusText);
        return [];
    }
    
    const data = await response.json();
    return data.items.map(item => ({
        title: item.snippet.title,
        videoId: item.id.videoId,
        thumbnail: item.snippet.thumbnails.default.url,
    }));
}

function displayVideos(videos) {
    const videoList = document.getElementById('videoList');
    videoList.innerHTML = '';

    if (videos.length === 0) {
        videoList.innerHTML = '<p>No videos found.</p>';
        return;
    }

    videos.forEach(video => {
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.innerHTML = `
            <img src="${video.thumbnail}" alt="${video.title}">
            <h3>${video.title}</h3>
            <button class="add-to-queue" onclick="addToQueue('${video.videoId}', '${video.title}')">Add to Queue</button>
        `;
        videoList.appendChild(videoItem);
    });
}

function playVideo(videoId) {
    const player = document.getElementById('player');
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
}

function addToQueue(videoId, title) {
    // Add to queue
    queue.push({ videoId, title });
    displayQueue();
}

function displayQueue() {
    const queueList = document.getElementById('queueList');
    queueList.innerHTML = '';

    if (queue.length === 0) {
        queueList.innerHTML = '<p>No videos in queue.</p>';
        return;
    }

    queue.forEach((item, index) => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item';
        queueItem.innerHTML = `
            <h3>${item.title}</h3>
            <button class="delete-from-queue" onclick="removeFromQueue(${index})">X</button>
        `;
        queueList.appendChild(queueItem);
    });
}

function playQueue() {
    if (queue.length === 0) {
        alert("No videos in queue.");
        return;
    }

    currentIndex = 0; // Start from the first video
    playNextSong();
}

function playNextSong() {
    if (currentIndex < queue.length) {
        const nextVideo = queue[currentIndex];
        if (nextVideo) {
            playVideo(nextVideo.videoId);
        }
    } else {
        alert("End of queue reached.");
        currentIndex = queue.length; // Prevent going beyond the end of the queue
    }
}

// Skip the current song and play the next one
function skipCurrentSong() {
    if (currentIndex < queue.length) {
        currentIndex++; // Move to the next video
        removeFromQueue(currentIndex - 1); // Remove the current song
        playNextSong(); // Play the next song in the queue
    } else {
        alert("No more songs in the queue to skip.");
    }
}

// Remove a song from the queue
function removeFromQueue(index) {
    if (index >= 0 && index < queue.length) {
        queue.splice(index, 1); // Remove the song from the array
        if (currentIndex >= index) {
            currentIndex--; // Adjust the current index if necessary
        }
        displayQueue(); // Update the displayed queue
    }
}

// Listen for message from YouTube iframe when video ends
window.addEventListener('message', function(event) {
    if (event.origin.includes('youtube.com') && event.data && typeof event.data === 'string') {
        const data = JSON.parse(event.data);
        if (data.event === 'onStateChange' && data.info === 0) { // Video ended
            removeFromQueue(currentIndex); // Remove the finished song from the queue
            playNextSong(); // Play the next song
        }
    }
});
