import { getCookie, setCookie, eraseCookie } from './cookie.mjs'

export async function initUsers() {
    let response = await fetch("http://localhost:8080/api/utenti");
    let res = await response.json();

    res.forEach(element => {
        if(element.email != "TEST"){
            $('.dropdown-menu').append(`
                <li>
                    <a class="dropdown-item" data-email="${element.email}" href="#">${element.name}</a>
                </li>
            `);
        }
    });

    $('.dropdown-item').click(function () {
        setCookie('log-in', this.dataset.email, 0.02);
        location.reload();
    })

    if (getCookie('log-in')) {
        response = await fetch(`http://localhost:8080/api/utenti/${getCookie('log-in')}`)
        res = await response.json();
        $('#saldoDiv').removeClass('d-none')
        $('#saldo').text(`${res.saldo}€`)
        $('.dropdown-toggle').html(res.name);
        if(res.name != "Admin"){
            $('#ReportOrdini').hide();
        }
    }else{
        $('#ReportOrdini').hide();
    }
}