let cart

export default {
  set(items) {
    console.log(`shopping cart`, items)
    cart = items
  },
  get() {
    return cart
  }
}
