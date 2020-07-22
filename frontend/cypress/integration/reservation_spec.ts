/// <reference types="cypress" />

describe('Index page', () => {
    it('Successfully loads', () => {
        cy.visit('/')
    })
})