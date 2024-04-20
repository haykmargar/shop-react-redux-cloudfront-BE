export interface ProductInterface {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
}

export interface ProductDataInterface {
  product: ProductInterface;
  count: number;
}

export interface ProductServiceAPIInterface {
  getProductById: (id: string) => Promise<ProductInterface>;
  getProductsList: () => Promise<ProductDataInterface[]>;
}
