

document.addEventListener('DOMContentLoaded', () => {
    // API Endpoint for json-server
    const API_URL = 'https://week3-ss0e.onrender.com/posts';

    // DOM elements
    const postsContainer = document.getElementById('posts-container');
    const createPostBtn = document.getElementById('create-post-btn');
    const postModal = document.getElementById('post-modal');
    const modalTitle = document.getElementById('modal-title');
    const postForm = document.getElementById('post-form');
    const cancelPostBtn = document.getElementById('cancel-post-btn');

    // Form input elements
    const postIdInput = document.getElementById('post-id');
    const postTitleInput = document.getElementById('post-title');
    const postAuthorInput = document.getElementById('post-author');
    const postDateInput = document.getElementById('post-date');
    const postContentInput = document.getElementById('post-content');
    const postTagsInput = document.getElementById('post-tags');

    // Array to hold blog posts (local cache for rendering)
    let posts = [];

    /**
     * Fetches blog posts from the json-server API.
     */
    async function fetchBlogPosts() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            // Update the message in the DOM for user feedback using the custom loading-message class
            const loadingMessageElement = postsContainer.querySelector('.loading-message');
            if (loadingMessageElement) {
                loadingMessageElement.textContent = 'Failed to load blog posts. Please ensure json-server is running at http://localhost:3000.';
                loadingMessageElement.style.color = 'var(--color-red-600)'; // Apply error color from CSS variable
            } else {
                // Fallback if loading-message element is not found for some reason
                postsContainer.innerHTML = '<p class="loading-message" style="color: var(--color-red-600);">Failed to load blog posts. Please ensure json-server is running at http://localhost:3000.</p>';
            }
            return []; // Return empty array on error
        }
    }

    /**
     * Renders the current blog posts array into the DOM.
     * Clears the container and repopulates it with updated post elements.
     */
    function renderBlogPosts() {
        postsContainer.innerHTML = ''; // Clear existing content

        if (posts.length === 0) {
            postsContainer.innerHTML = '<p class="loading-message">No blog posts to display. Click "Create New Post" to add one!</p>';
            return;
        }

        // Sort posts by date in descending order (most recent first)
        const sortedPosts = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedPosts.forEach(post => {
            const postElement = document.createElement('article');
            // Using custom CSS classes defined in style.css
            postElement.className = 'post-card';
            postElement.innerHTML = `
                <h3 class="post-title-heading">${post.title}</h3>
                <div class="post-meta">
                    <span>By <span class="post-author">${post.author}</span></span>
                    <span>&bull;</span>
                    <span>${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <p class="post-content-preview">${post.content.substring(0, 300)}...</p>
                <div class="post-tags-container">
                    ${(post.tags || []).map(tag => `<span class="post-tag">${tag}</span>`).join('')}
                </div>
                <div class="post-actions">
                    <button class="edit-button" data-id="${post.id}">Edit</button>
                    <button class="delete-button" data-id="${post.id}">Delete</button>
                    <a href="#" class="read-more-link">Read More &rarr;</a>
                </div>
            `;
            postsContainer.appendChild(postElement);
        });

        // Add event listeners to newly rendered edit/delete buttons
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const postId = parseInt(event.target.dataset.id);
                editPost(postId);
            });
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const postId = parseInt(event.target.dataset.id);
                deletePost(postId);
            });
        });
    }

    /**
     * Shows the post creation/editing modal.
     * @param {Object|null} postData - The post data to pre-fill the form, or null for a new post.
     */
    function showPostModal(postData = null) {
        postForm.reset(); // Clear form fields
        if (postData) {
            // Populate form for editing
            modalTitle.textContent = 'Edit Post';
            postIdInput.value = postData.id;
            postTitleInput.value = postData.title;
            postAuthorInput.value = postData.author;
            postDateInput.value = postData.date;
            postContentInput.value = postData.content;
            postTagsInput.value = (postData.tags || []).join(', ');
        } else {
            // For new post
            modalTitle.textContent = 'Create New Post';
            postIdInput.value = ''; 
            const today = new Date();
            postDateInput.value = today.toISOString().split('T')[0];
        }
        postModal.classList.remove('hidden'); 
    }

    function hidePostModal() {
        postModal.classList.add('hidden'); 
    }

    async function handlePostFormSubmit(event) {
        event.preventDefault(); // Prevent default form submission

        const id = postIdInput.value ? parseInt(postIdInput.value) : null;
        const title = postTitleInput.value.trim();
        const author = postAuthorInput.value.trim();
        const date = postDateInput.value;
        const content = postContentInput.value.trim();
        const tags = postTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

        if (!title || !author || !date || !content) {
            
            console.warn("Please fill in all required fields (Title, Author, Date, Content).");
            return;
        }

        const postData = {
            title,
            author,
            date,
            content,
            tags
        };

        try {
            let response;
            if (id) {
                // Editing existing post using PUT request
                response = await fetch(`${API_URL}/${id}`, {
                    method: 'PUT', // Use PUT for full replacement of the resource
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });
                if (response.ok) {
                    console.log(`Post with ID ${id} updated on server.`);
                } else {
                    throw new Error(`Failed to update post: ${response.statusText}`);
                }
            } else {
                // Creating new post using POST request
                response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });
                if (response.ok) {
                    console.log('New post created on server.');
                } else {
                    throw new Error(`Failed to create post: ${response.statusText}`);
                }
            }
            // re-fetch and re-render posts
            posts = await fetchBlogPosts();
            renderBlogPosts();
            hidePostModal(); 
        } catch (error) {
            console.error('Error saving post:', error);
            
        }
    }

    function editPost(id) {
        const postToEdit = posts.find(post => post.id === id);
        if (postToEdit) {
            showPostModal(postToEdit);
        } else {
            console.error(`Post with ID ${id} not found for editing.`);
        }
    }

    async function deletePost(id) {
       
        if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    throw new Error(`Failed to delete post: ${response.statusText}`);
                }
                console.log(`Post with ID ${id} deleted from server.`);
                
                posts = await fetchBlogPosts();
                renderBlogPosts();
            } catch (error) {
                console.error('Error deleting post:', error);
               
            }
        }
    }

    // Event Listeners
    createPostBtn.addEventListener('click', () => showPostModal());
    cancelPostBtn.addEventListener('click', hidePostModal);
    postForm.addEventListener('submit', handlePostFormSubmit);

    
    (async () => {
        posts = await fetchBlogPosts();
        renderBlogPosts();
    })();
});
