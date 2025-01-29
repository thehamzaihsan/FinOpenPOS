export default function OrderSubPage({
    params,
  }: {
    params: { orderId: string };
  }){

    return(
        <p>{params.orderId}</p>
    )
}