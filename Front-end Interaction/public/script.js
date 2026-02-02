const API_BASE = 'http://localhost:3000/tasks';
const taskForm = document.getElementById('task-form');
const editForm = document.getElementById('edit-form');
const taskList = document.getElementById('task-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('edit-modal');
const closeBtn = document.querySelector('.close');

let currentFilter = 'all';

let allTasks = [];

// Fetch and display tasks
async function fetchTasks() {
  try {
    const response = await fetch(API_BASE);
    allTasks = await response.json();
    displayTasks(allTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
}

// Display tasks in the list
function displayTasks(tasks) {
  const filteredTasks = tasks.filter(task => {
    if (currentFilter === 'pending') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });

  taskList.innerHTML = '';

  if (filteredTasks.length === 0) {
    taskList.innerHTML = '<p class="no-tasks">No tasks found.</p>';
    return;
  }

  filteredTasks.forEach(task => {
    const taskElement = createTaskElement(task);
    taskList.appendChild(taskElement);
  });
}

// Create task element
function createTaskElement(task) {
  const div = document.createElement('div');
  div.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;
  div.dataset.id = task.id;

  const dueDateDisplay = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  div.innerHTML = `
    <div class="task-header">
      <h3 class="task-title">${task.title}</h3>
      <span class="task-priority priority-${task.priority}">${task.priority}</span>
    </div>
    <p class="task-description">${task.description || 'No description'}</p>
    <div class="task-meta">
      <span class="task-due ${isOverdue ? 'overdue' : ''}">Due: ${dueDateDisplay}</span>
      <span class="task-status">${task.completed ? 'Completed' : 'Pending'}</span>
    </div>
    <div class="task-actions">
      <button class="btn btn-edit" data-action="edit">Edit</button>
      <button class="btn btn-toggle" data-action="toggle">${task.completed ? 'Mark Pending' : 'Mark Complete'}</button>
      <button class="btn btn-delete" data-action="delete">Delete</button>
    </div>
  `;

  return div;
}

// Add a new task
async function addTask(taskData) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });
    if (response.ok) {
      fetchTasks();
      taskForm.reset();
    }
  } catch (error) {
    console.error('Error adding task:', error);
  }
}

// Update a task
async function updateTask(id, updates) {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    if (response.ok) {
      fetchTasks();
      closeModal();
    }
  } catch (error) {
    console.error('Error updating task:', error);
  }
}

// Delete a task
async function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      fetchTasks();
    }
  } catch (error) {
    console.error('Error deleting task:', error);
  }
}

// Open edit modal
function openEditModal(task) {
  document.getElementById('edit-id').value = task.id;
  document.getElementById('edit-title').value = task.title;
  document.getElementById('edit-description').value = task.description;
  document.getElementById('edit-priority').value = task.priority;
  document.getElementById('edit-dueDate').value = task.dueDate ? task.dueDate.split('T')[0] : '';
  document.getElementById('edit-completed').checked = task.completed;
  modal.style.display = 'block';
}

// Close modal
function closeModal() {
  modal.style.display = 'none';
}

// Event listeners
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const taskData = {
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    priority: document.getElementById('priority').value,
    dueDate: document.getElementById('dueDate').value || null
  };
  addTask(taskData);
});

editForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-id').value;
  const updates = {
    title: document.getElementById('edit-title').value.trim(),
    description: document.getElementById('edit-description').value.trim(),
    priority: document.getElementById('edit-priority').value,
    dueDate: document.getElementById('edit-dueDate').value || null,
    completed: document.getElementById('edit-completed').checked
  };
  updateTask(id, updates);
});

taskList.addEventListener('click', (e) => {
  const taskElement = e.target.closest('.task-item');
  if (!taskElement) return;

  const id = parseInt(taskElement.dataset.id);
  const action = e.target.dataset.action;

  if (action === 'edit') {
    const task = getTaskById(id);
    if (task) openEditModal(task);
  } else if (action === 'toggle') {
    const task = getTaskById(id);
    if (task) updateTask(id, { completed: !task.completed });
  } else if (action === 'delete') {
    deleteTask(id);
  }
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    fetchTasks();
  });
});

closeBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Helper function to get task by ID
function getTaskById(id) {
  return allTasks.find(task => task.id === id);
}

// Initial load
fetchTasks();