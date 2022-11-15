import createUser from './user';

test('Create a user', () => {
  // GIVEN
  const fName = 'John';
  const lName = 'Doe';

  // WHEN
  const user = createUser(fName, lName);

  // THEN
  expect(user).toEqual({
    firstName: fName,
    lastName: lName,
  });
});
