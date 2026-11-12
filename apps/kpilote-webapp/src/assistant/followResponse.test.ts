import { describe, expect, it } from 'vitest'

import { isNearBottom } from './followResponse'

describe('isNearBottom', () => {
  it('suit le fil tant qu’on est à moins de 50 px du bas', () => {
    expect(isNearBottom({ scrollTop: 500, scrollHeight: 1000, clientHeight: 500 })).toBe(true)
    expect(isNearBottom({ scrollTop: 451, scrollHeight: 1000, clientHeight: 500 })).toBe(true)
  })

  it('décroche quand on a remonté de 50 px ou plus', () => {
    expect(isNearBottom({ scrollTop: 450, scrollHeight: 1000, clientHeight: 500 })).toBe(false)
    expect(isNearBottom({ scrollTop: 0, scrollHeight: 1000, clientHeight: 500 })).toBe(false)
  })
})
