export class Producto {
    id: number;
    img: string;
    imgId: string;
    codigo: string;
    nombre: string;
    descripcion: string;
    precio: number;
    costo: number;
    stock: number;
    stockMinimo: number;
    unidadMedida: string;
    categoria: string;
    estado: string;

    f_producto: number;
    f_categoria: number;
    f_nombre: number;
    f_precio: number;
    f_costo: number;
    f_stockMinimo: number;
    f_unidadMedida: string;
    f_codigo: string;
    f_descripcion: string;
    f_img: string;
    f_imgId: string;
    f_download_link: string;
    f_cantidad: number;
    f_observacion: number;
    f_subTotal: number;
    f_txtCategoria: string;
    f_txtProducto: string;
}
