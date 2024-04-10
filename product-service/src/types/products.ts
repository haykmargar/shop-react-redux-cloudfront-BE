export interface ProductInterface {
    id: string;
    title: string;
    description: string;
    price: number;
    image: string
}

export interface ProductServiceAPIInterface {
    getProductById: (id: string) => Promise<ProductInterface>;
    getProductsList: () => Promise<ProductInterface[]>;
}
