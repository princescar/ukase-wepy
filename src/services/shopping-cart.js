let cart

export default {
  set(items) {
    cart = items
  },
  get() {
    return cart
  }
}
