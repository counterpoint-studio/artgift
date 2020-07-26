/// <reference types="cypress" />

describe('Reservation process', () => {

    beforeEach(() => {
        cy.exec('npm run --prefix ../functions/scripts test:initDatabase databaseSeed.json')
    })

    it('Is successfully completed and cancelled', () => {
        cy.visit('/')
        cy.get('main.isVisible', { timeout: 20000 })
        cy.wait(1500)

        cy.contains('Give a gift').click()
        cy.wait(1500)

        cy.contains('attend the performance').click()
        cy.contains('consent to my personal information').click()
        cy.contains('Begin').click()
        cy.wait(1500)

        cy.get('#toName').type('Jane Doe')
        cy.get('#toAddress').type("Leikkikuja 2")
        cy.get('#toLanguage').select('Finnish')
        cy.get('#toSignificance').type('My wonderful mum')
        cy.contains('Next').click()
        cy.wait(1500)

        cy.contains('12:00').parents('tr').contains('Book').click()
        cy.get('body.from main.isVisible', { timeout: 15000 });

        cy.get('#fromName').type('John Doe')
        cy.get('#fromPhoneNumber').type('0400000000')
        cy.get('#fromEmail').type('john@test.email')
        cy.get('#fromSpecialInfo').type('See you under the large tree')
        cy.contains('Send gift').click()
        cy.wait(1500)

        cy.contains('status of your gift').click()
        cy.wait(1500)

        cy.contains('Status').parents('tr').should('contain', 'Waiting for confirmation')
        cy.contains('From').parents('tr').should('contain', 'John Doe')
        cy.contains('To').parents('tr').should('contain', 'Jane Doe')
        cy.contains('Time').parents('tr').should('contain', '12:00')
        cy.contains('Place').parents('tr').should('contain', 'Leikkikuja 2')

        cy.get('#cancellationReason').type('something came up');
        cy.get('button[type=submit]').click()
        cy.contains('Status').parents('tr').should('contain', 'Cancelled')


    })
})