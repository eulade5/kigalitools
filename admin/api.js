window.api = {

  async listProducts() {
    const { data, error } = await window.sb
      .from('products')
      .select('*')

    if(error) throw error

    return data || []
  },

  async createProduct(product) {
    const { error } = await window.sb
      .from('products')
      .insert(product)

    if(error) throw error
  },

  async updateProduct(id, product) {
    const { error } = await window.sb
      .from('products')
      .update(product)
      .eq('id', id)

    if(error) throw error
  },

  async deleteProduct(id) {
    const { error } = await window.sb
      .from('products')
      .delete()
      .eq('id', id)

    if(error) throw error
  },

  async listCategories() {
    const { data, error } = await window.sb
      .from('categories')
      .select('*')

    if(error) throw error

    return data || []
  },

  async createCategory(category) {
    const { error } = await window.sb
      .from('categories')
      .insert(category)

    if(error) throw error
  },

  async deleteCategory(id) {
    const { error } = await window.sb
      .from('categories')
      .delete()
      .eq('id', id)

    if(error) throw error
  },

  async uploadImage(file) {

    const fileName =
      Date.now() + '-' + file.name

    const { error } = await window.sb.storage
      .from('products')
      .upload(fileName, file)

    if(error) throw error

    const { data } = window.sb.storage
      .from('products')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

}