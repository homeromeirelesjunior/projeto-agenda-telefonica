var persons = [];
var editId;

const API = {
    CREATE: "./person",
    READ: "./api/list.json",
    UPDATE: "./person",
    DELETE: "./person"
};
const ACTION_METHODS = {
    CREATE: "POST",
    READ: "GET",
    UPDATE: "PUT",
    DELETE: "DELETE"
};

window.PhoneBook = {
    getRow: function(person) {
        return `<tr>
            <td>${person.name}</td>
            <td>${person.phone}</td>
            <td>${person.address}</td>
            <td>${person.email}</td>
            <td>
                <a href='#' data-id='${person.id}' class='edit'>&#9998;</a>
                <a href='#' data-id='${person.id}' class='delete'>&#10006;</a>
            </td>
        </tr>`;
    },

    load: function () {
        $.ajax({
            url: '/listAll',
            method: ACTION_METHODS.READ, 
            dataTypes: 'json'
        }).done(function (persons) {
            PhoneBookLocalActions.load(persons);
            PhoneBook.display(persons);
        });
    },

    delete: function(id) {
        Swal.fire({
            title: 'Tem certeza?',
            text: "Não será possível reverter essa ação!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            cancelButtonText: 'Cancelar!',
            confirmButtonText: 'Sim! Deletar contato!'
          }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: API.DELETE + `?id=${id}`,
                    method: ACTION_METHODS.DELETE
                }).done(function (response) {
                    if (response.success) {
                        Swal.fire(
                            'Excluido!',
                            'Seu contato foi excluido.',
                            'success'
                        )
                        PhoneBookLocalActions.delete(id);
                        PhoneBook.load();
                    }
                });
            }         

          })


    },

    add: function(person) {
        $.ajax({
            url: API.CREATE,
            method: ACTION_METHODS.CREATE,
            data: person
        }).done(function (response) {
            if (response.success) {
                PhoneBook.cancelEdit();
                PhoneBookLocalActions.add(person);
                PhoneBook.load();
            }
        });
    },

    update: function(person) {
        $.ajax({
            url: API.UPDATE,
            method: ACTION_METHODS.UPDATE,
            data: person
        }).done(function (response) {
            if (response.success) {
                PhoneBook.cancelEdit();
                PhoneBookLocalActions.update(person);
                PhoneBook.load();
            }
        });
    },

    bindEvents: function() {
        $('#phone-book tbody').delegate('a.edit', 'click', function () {
            var id = $(this).data('id');
            PhoneBook.startEdit(id);
        });

        $('#phone-book tbody').delegate('a.delete', 'click', function () {
            var id = $(this).data('id');
            console.info('click on ', this, id);
            PhoneBook.delete(id);
        });

        $(".add-form").submit(function() {
            const person = {
                name: $('input[name=name]').val(),
                phone: $('input[name=phone]').val(),
                address: $('input[name=address]').val(),
                email: $('input[name=email]').val()
            };

            if (editId) {
                person.id = editId;
                PhoneBook.update(person);
            } else {
                PhoneBook.add(person);
            }
        });

        document.getElementById('search').addEventListener('input', function(ev) {
            //const value = document.getElementById('search').value;
            const value = this.value;
            PhoneBook.search(value);
        });
        document.querySelector('.add-form').addEventListener('reset', function(ev) {
            PhoneBook.search("");
        });
    },

    startEdit: function (id) {
        var editPerson = persons.find(function (person) {
            return person.id == id;
        });
        console.debug('startEdit', editPerson);

        $('input[name=name]').val(editPerson.name);
        $('input[name=phone]').val(editPerson.phone);
        $('input[name=address]').val(editPerson.address);
        $('input[name=email]').val(editPerson.email);
        editId = id;
    },

    cancelEdit: function() {
        editId = '';
        document.querySelector(".add-form").reset();
    },

    display: function(persons) {
        var rows = '';

        persons.forEach(person => rows += PhoneBook.getRow(person));

        $('#phone-book tbody').html(rows);
    },

    search: function (value) {
        value = value.toLowerCase();
        
        var filtered = persons.filter(function (person) {
            return person.name.toLowerCase().includes(value) ||
                person.phone.toLowerCase().includes(value);
        });
    
        PhoneBook.display(filtered);
    }
};


window.PhoneBookLocalActions = {
    load: (persons) => {
        // salva persons como uma variável global
        window.persons = persons;
    },
    add: person => {
        person.id = new Date().getTime();
        persons.push(person);
        PhoneBook.display(persons);
    },
    delete: id => {
        var remainingPersons = persons.filter(person => person.id !== id);
        window.persons = remainingPersons;
        PhoneBook.display(remainingPersons);
    },
    update: person => {
        const id = person.id;
        var personToUpdate = persons.find(person => person.id === id);
        personToUpdate.name = person.name;
        personToUpdate.phone = person.phone;
        personToUpdate.address = person.address;
        personToUpdate.email = person.email;
        PhoneBook.display(persons);
    }
}

PhoneBook.load();
PhoneBook.bindEvents();