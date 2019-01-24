let cart

export default {
  set(items) {
    console.log(`Set shopping cart to: `, items)
    cart = items
  },
  get() {
    return cart
  }
}
