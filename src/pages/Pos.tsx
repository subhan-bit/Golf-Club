import ProductGrid from '../components/pos/ProductGrid'
import BasketPanel from '../components/pos/BasketPanel'

export default function Pos() {
  return (
    <div className="h-full flex">
      <div className="flex-1 min-w-0">
        <ProductGrid />
      </div>
      <BasketPanel />
    </div>
  )
}
