// ===== Global State =====
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let posts = JSON.parse(localStorage.getItem("posts")) || [];
let darkMode = localStorage.getItem("darkMode") === "true";
let selectedImageData = "";

// ===== DOM Elements =====
const authScreen = document.getElementById('auth-screen');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignupBtn = document.getElementById('show-signup');
const hideSignupBtn = document.getElementById('hide-signup');
const welcomeUserSpan = document.getElementById('welcome-user');
const logoutBtn = document.getElementById('logout-btn');
const postTextarea = document.getElementById('post-text');
const publishBtn = document.getElementById('publish-btn');
const postsFeed = document.getElementById('posts-feed');
const searchInput = document.getElementById('search-input');
const uploadBtn = document.getElementById('upload-btn');
const postFileInput = document.getElementById('post-image-file');
const selectedFileName = document.getElementById('selected-file-name');
const body = document.body;
const darkToggle = document.getElementById('dark-mode-toggle');

// ===== Helpers =====
function savePosts() { localStorage.setItem("posts", JSON.stringify(posts)); }
function saveCurrentUser() { localStorage.setItem("currentUser", JSON.stringify(currentUser)); }
function toggleDarkMode() {
  darkMode = !darkMode;
  localStorage.setItem("darkMode", darkMode);
  if(darkMode){ body.classList.add("bg-gray-900","text-gray-100"); body.classList.remove("bg-gray-100","text-gray-900"); }
  else{ body.classList.add("bg-gray-100","text-gray-900"); body.classList.remove("bg-gray-900","text-gray-100"); }
}

// ===== Image Upload =====
uploadBtn.addEventListener('click', ()=> postFileInput.click());
postFileInput.addEventListener('change', ()=> {
  const file = postFileInput.files[0];
  if(file){
    selectedFileName.textContent = file.name;
    const reader = new FileReader();
    reader.onload = e => selectedImageData = e.target.result;
    reader.readAsDataURL(file);
  }
});

// ===== Create Post Element =====
function createPostElement(post){
  const card = document.createElement('div');
  card.className = "post-card bg-gray-800 p-4 rounded-md shadow-md mb-2";
  card.dataset.id = post.id;

  const commentsHtml = post.comments.map(c => `<div class="text-sm mb-1"><strong>${c.author}:</strong> ${c.text}</div>`).join("");

  card.innerHTML = `
    <div class="flex justify-between mb-2">
      <span class="font-semibold">${post.author}</span>
      <span class="text-xs">${new Date(post.timestamp).toLocaleString()}</span>
    </div>
    <p class="post-content mb-2">${post.text}</p>
    ${post.imageData ? `<img src="${post.imageData}" class="rounded-md max-w-full mb-2">` : ''}
    <div class="flex gap-2 mb-2">
      <button class="like-btn px-2 py-1 rounded ${post.likesBy?.includes(currentUser?.name) ? 'bg-red-500 text-white':'bg-gray-700'}">${post.likes} ❤</button>
      <button class="comment-toggle-btn px-2 py-1 bg-gray-700 rounded">💬 ${post.comments.length}</button>
      ${post.author === currentUser?.name ? `<button class="edit-btn px-2 py-1 bg-yellow-500 rounded">✏ Edit</button>` : ''}
      <button class="share-btn px-2 py-1 bg-blue-500 rounded">🔗 Share</button>
      ${post.author === currentUser?.name ? `<button class="delete-btn px-2 py-1 bg-red-600 rounded">Delete</button>` : ''}
    </div>
    <div class="comments-section hidden">
      ${commentsHtml}
      <form class="add-comment-form flex gap-2 mt-2">
        <input type="text" class="flex-1 px-2 py-1 rounded bg-gray-700 text-gray-100" placeholder="Write a comment..." required>
        <button class="px-2 py-1 bg-green-500 rounded">Add</button>
      </form>
    </div>
  `;

  // Like
  card.querySelector('.like-btn')?.addEventListener('click', ()=>{
    post.likesBy = post.likesBy || [];
    if(post.likesBy.includes(currentUser.name)) post.likesBy = post.likesBy.filter(u=>u!==currentUser.name);
    else post.likesBy.push(currentUser.name);
    post.likes = post.likesBy.length;
    savePosts(); renderPosts();
  });

  // Delete
  card.querySelector('.delete-btn')?.addEventListener('click', ()=>{
    if(confirm("Delete post?")){
      posts = posts.filter(p=>p.id!==post.id);
      savePosts(); renderPosts();
    }
  });

  // Edit
  card.querySelector('.edit-btn')?.addEventListener('click', ()=>{
    const newText = prompt("Edit post:", post.text);
    if(newText){ post.text = newText; savePosts(); renderPosts(); }
  });

  // Share
  card.querySelector('.share-btn')?.addEventListener('click', ()=>{
    if(navigator.share){ navigator.share({title:"Mini Social App", text:post.text, url:window.location.href}).catch(()=>{}); }
    else{ navigator.clipboard.writeText(post.text); alert("Post text copied!"); }
  });

  // Toggle comments
  const commentSec = card.querySelector('.comments-section');
  card.querySelector('.comment-toggle-btn')?.addEventListener('click', ()=> commentSec.classList.toggle('hidden'));

  // Add comment
  card.querySelector('.add-comment-form')?.addEventListener('submit', e=>{
    e.preventDefault();
    const input = e.target.querySelector('input');
    if(input.value.trim()){ post.comments.push({author:currentUser.name,text:input.value.trim(),timestamp:Date.now()}); savePosts(); renderPosts(); }
  });

  return card;
}

// ===== Render Posts =====
function renderPosts(filtered=null){
  postsFeed.innerHTML = '';
  posts = JSON.parse(localStorage.getItem("posts")) || [];
  const listToRender = filtered ? filtered : posts;
  listToRender.slice().sort((a,b)=>b.id - a.id).forEach(p=>postsFeed.appendChild(createPostElement(p)));
}

// ===== Signup =====
signupForm.addEventListener('submit', e=>{
  e.preventDefault();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  currentUser = {name,email}; saveCurrentUser();
  alert(`Account created for ${name}!`);
  signupForm.classList.add('hidden'); loginForm.classList.remove('hidden');
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = "password";
});

// ===== Login =====
loginForm.addEventListener('submit', e=>{
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  if(!email){ alert("Enter email!"); return; }

  const name = email.split('@')[0];
  currentUser = {name,email};
  saveCurrentUser();

  // ✅ Load latest posts
  posts = JSON.parse(localStorage.getItem("posts")) || [];

  authScreen.classList.add('hidden');
  mainApp.classList.remove('hidden');
  welcomeUserSpan.textContent = `Welcome, ${currentUser.name}!`;
  renderPosts();
});

// ===== Logout =====
logoutBtn.addEventListener('click', ()=>{
  currentUser = null; saveCurrentUser();
  authScreen.classList.remove('hidden'); mainApp.classList.add('hidden');
});

// ===== Toggle Forms =====
showSignupBtn.addEventListener('click', ()=>{ loginForm.classList.add('hidden'); signupForm.classList.remove('hidden'); });
hideSignupBtn.addEventListener('click', ()=>{ signupForm.classList.add('hidden'); loginForm.classList.remove('hidden'); });

// ===== Publish Post =====
publishBtn.addEventListener('click', ()=>{
  const text = postTextarea.value.trim();
  if(!text){ alert("Post cannot be empty!"); return; }

  const newPost = {id:Date.now(),author:currentUser.name,text,imageData:selectedImageData||"",timestamp:Date.now(),likes:0,likesBy:[],comments:[]};
  posts.push(newPost);
  savePosts();

  // Clear inputs
  postTextarea.value = ""; selectedImageData=""; selectedFileName.textContent="";
  // Render latest posts
  posts = JSON.parse(localStorage.getItem("posts")) || [];
  renderPosts();
});

// ===== Search =====
let searchTimeout;
searchInput.addEventListener('input', ()=>{
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(()=>{
    const term = searchInput.value.toLowerCase();
    const filtered = posts.filter(p=>p.text.toLowerCase().includes(term) || p.author.toLowerCase().includes(term));
    renderPosts(filtered);
  },300);
});

// ===== Dark Mode =====
darkToggle.addEventListener('click', toggleDarkMode);

// ===== Initialize =====
if(darkMode) toggleDarkMode();
if(currentUser){ authScreen.classList.add('hidden'); mainApp.classList.remove('hidden'); welcomeUserSpan.textContent=`Welcome, ${currentUser.name}!`; renderPosts(); }
