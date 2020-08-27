export function deepCopy( source ) {
  if (!isObject(source)) return source; //如果不是对象的话直接返回
  let target = Array.isArray( source ) ? [] : {} //数组兼容
  for ( var k in source ) {
    if (source.hasOwnProperty(k)) {
      if ( typeof source[ k ] === 'object' ) {
        target[ k ] = deepCopy( source[ k ] )
      } else {
        target[ k ] = source[ k ]
      }
    }
  }
  return target
}

export function isObject(obj) {
  return typeof obj === 'object' && obj !== null
}
