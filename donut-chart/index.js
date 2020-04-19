const form = document.querySelector('form');
const nameInput = document.getElementById('name');
const costInput = document.getElementById('cost');
const error = document.getElementById('error');

form.addEventListener('submit', async e => {
  e.preventDefault();

  const name = nameInput.value;
  const cost = costInput.value;

  if (!name || !cost) {
    error.textContent = "Please enter values before submitting";
    return;
  }

  const item = { name, cost: +cost };

  try {
    await db.collection('expenses').add(item);
    error.textContent = '';
    nameInput.value = '';
    costInput.value = '';
  } catch (err) {
    console.error(err);
    error.textContent = 'Something went wrong';
  }
});
