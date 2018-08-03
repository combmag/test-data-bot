const {
  build,
  fake,
  sequence,
  incrementingId,
  perBuild,
  oneOf,
  bool,
  arrayOf,
} = require('./index')

expect.extend({
  toBeTrueOrFalse(received) {
    const pass = received === true || received === false

    if (pass) {
      return {
        pass: true,
        message: () => `expected ${received} not to be true or false`,
      }
    } else {
      return {
        pass: false,
        message: () => `expected ${received} to be true or false`,
      }
    }
  },
})

describe('generating fake items', () => {
  it('generates an object that can build items', () => {
    const userBuilder = build('User').fields({
      name: fake(f => f.name.findName()),
      email: sequence(x => `jack${x}@test.com`),
      age: 26,
    })

    const user = userBuilder()
    expect(user).toEqual({
      name: expect.any(String),
      email: 'jack1@test.com',
      age: 26,
    })
  })

  it('increases sequence numbers', () => {
    const userBuilder = build('User').fields({
      email: sequence(x => `jack${x}@test.com`),
    })

    const users = [userBuilder(), userBuilder(), userBuilder()]
    expect(users.map(u => u.email)).toEqual([
      'jack1@test.com',
      'jack2@test.com',
      'jack3@test.com',
    ])
  })

  it('allows a specific value to override', () => {
    const userBuilder = build('User').fields({
      name: fake(f => f.name.findName()),
      email: sequence(x => `jack${x}@test.com`),
    })

    const user = userBuilder({ email: 'foo' })

    expect(user).toEqual({
      name: expect.any(String),
      email: 'foo',
    })
  })

  it('supports oneOf to allow semi-random values', () => {
    const userBuilder = build('User').fields({
      name: oneOf('a', 'b', 'c'),
    })

    const user = userBuilder()

    expect(user.name).toMatch(/a|b|c/)
  })

  it('allows a map function to translate the built object', () => {
    const mapFn = jest.fn().mockImplementation(x => 'DUMMY_USER_MAP')

    const userBuilder = build('User')
      .fields({
        name: fake(f => 'Jack'),
        email: sequence(x => `jack${x}@test.com`),
      })
      .map(mapFn)

    const user = userBuilder()

    expect(user).toEqual('DUMMY_USER_MAP')
    expect(mapFn).toHaveBeenCalledWith({
      name: 'Jack',
      email: 'jack1@test.com',
    })
  })

  it('supports an incrementing ID field', () => {
    const userBuilder = build('User').fields({
      id: incrementingId(),
    })

    const user1 = userBuilder()
    const user2 = userBuilder()

    expect(user1.id).toEqual(1)
    expect(user2.id).toEqual(2)
  })

  it('allows static values that are generated at runtime', () => {
    const userBuilder = build('User').fields({
      name: fake(f => 'Jack'),
      email: sequence(x => `jack${x}@test.com`),
      someObject: perBuild(() => ({})),
    })

    const user1 = userBuilder()
    const user2 = userBuilder()

    expect(user1.someObject).not.toBe(user2.someObject)
  })

  it('allows a sequence to take a builder', () => {
    const userBuilder = build('User').fields({
      name: fake(f => 'Jack'),
      email: sequence(x => fake(f => f.name.findName() + x)),
    })
    const user = userBuilder()

    expect(user.email).toMatch(/(\w+)1/)
  })

  it('supports arrayOf with another builder', () => {
    const commentBuilder = build('Comment').fields({
      text: fake(f => f.lorem.sentence()),
    })

    const userBuilder = build('User').fields({
      friends: arrayOf(fake(f => f.name.findName()), 2),
      comments: arrayOf(commentBuilder(), 3),
    })

    const user = userBuilder()
    expect(user.friends).toEqual(
      expect.arrayContaining([expect.any(String), expect.any(String)])
    )
    expect(user.comments).toEqual(
      expect.arrayContaining(Array(3).fill({ text: expect.any(String) }))
    )
  })

  it('lets arrayOf take primitives', () => {
    const userBuilder = build('User').fields({
      comments: arrayOf(1, 3),
    })

    const user = userBuilder()

    expect(user.comments).toEqual([1, 1, 1])
  })

  it('defines boolean to return either true or false', () => {
    const userBuilder = build('User').fields({
      isAdmin: bool(),
    })
    const user = userBuilder()
    expect(user.isAdmin).toBeTrueOrFalse()
  })
})
