import { getCookie, setCookie, eraseCookie } from './cookie.mjs'

export async function initUsers() {
    let response = await fetch("http://localhost:8080/api/utenti");
    let res = await response.json();

    res.forEach(element => {
        $('.dropdown-menu').append(`
            <li>
                <a class="dropdown-item" data-email="${element.email}" href="#">${element.name}</a>
            </li>
        `);
    });

    $('.dropdown-item').click(function () {
        setCookie('log-in', this.dataset.email, 0.02);
        location.reload();
    })

    if (getCookie('log-in')) {
        response = await fetch(`http://localhost:8080/api/utenti/${getCookie('log-in')}`)
        res = await response.json();

        $('.dropdown-toggle').html(res.name);
    }
}