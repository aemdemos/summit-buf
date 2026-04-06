function buildVideoBackground(block) {
  const imageCol = block.querySelector(':scope > div:first-child > div');
  if (!imageCol) return;

  const links = [...imageCol.querySelectorAll('a')];
  const videoUrls = links
    .map((a) => a.href)
    .filter((href) => href.endsWith('.mp4'));
  if (!videoUrls.length) return;

  // Clear the image column and build the video player
  imageCol.textContent = '';
  imageCol.classList.add('hero-video-bg');

  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('aria-hidden', 'true');

  let currentIndex = 0;

  function loadVideo(index) {
    currentIndex = index % videoUrls.length;
    video.src = videoUrls[currentIndex];
    video.play().catch(() => {});
  }

  video.addEventListener('ended', () => {
    loadVideo(currentIndex + 1);
  });

  // If a video fails to load, skip to the next
  video.addEventListener('error', () => {
    loadVideo(currentIndex + 1);
  });

  imageCol.append(video);
  loadVideo(0);
}

export default function decorate(block) {
  if (block.classList.contains('video')) {
    buildVideoBackground(block);
  }
}
