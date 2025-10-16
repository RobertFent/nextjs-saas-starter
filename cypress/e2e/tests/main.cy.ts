describe('todo', () => {
	it('todo', () => {
		cy.request('GET', 'http://localhost:9000').then((response) => {
			expect(response.status).to.eq(200);
			expect(response.body).to.eq('Mock API server is up');
		});
	});
});
