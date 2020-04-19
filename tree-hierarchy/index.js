const form = document.querySelector('form');
const name = document.querySelector('#name');
const parent = document.querySelector('#parent');
const department = document.querySelector('#department');

// init modal
const modal = document.querySelector('#modal');
M.Modal.init(modal);

// event listeners
form.addEventListener('submit', async e => {
  e.preventDefault();

  try {
    await db.collection('employees').add({
      name: name.value,
      parent: parent.value,
      department: department.value
    });

    const modalInstance = M.Modal.getInstance(modal);
    modalInstance.close();

    form.reset();
  } catch (err) {
    console.error(err);
  }
});
