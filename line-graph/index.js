// DOM elements
const btns = document.querySelectorAll('button');
const form = document.querySelector('form');
const formActivity = document.querySelector('form span');
const input = document.querySelector('input');
const error = document.querySelector('.error');

let activity = 'running';

// event listeners
btns.forEach(btn => {
  btn.addEventListener('click', e => {
    // update active button
    activity = e.target.dataset.activity;
    btns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    // set id of input field
    input.setAttribute('id', activity);
    // update activity in form span
    formActivity.textContent = activity;

    update(data);
  });
});

form.addEventListener('submit', async e => {
  e.preventDefault();

  const distance = +input.value;
  if (!distance) {
    error.textContent = 'Please enter a valid distance';
    return;
  }

  try {
    await db.collection('activities').add({
      distance,
      activity,
      date: new Date().toString()
    });

    input.value = '';
    error.textContent = '';
  } catch (err) {
    console.error(err);
  }
});
