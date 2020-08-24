/**
 * 将特定字符相连的字符串转驼峰
 * @param str: 目标字符串
 * @param join：需要被是被识别的连接符
 * @param firstUpperCase：转换后的第一个字符串是否需要转换为大写
 * @returns {*}
 */
function toCamel(str, join, firstUpperCase) {
  if(typeof join == 'boolean'){
    firstUpperCase = join
    join = ''
  }
  join = join || '_'
  let regStr = ''
  let res = ''
  if(!Array.isArray(join)){
    join = [join]
  }
  join.forEach((item) => {
    regStr = `/([^${item}])(?:${item}+([^${item}]))/g`
    res = str.replace(eval(regStr), function ($0, $1, $2) {
      return $1 + $2.toUpperCase();
    });
  })
  if(firstUpperCase){
    res = res.substring(0, 1).toUpperCase() + res.substring(1)
  }
  return res
}
// 驼峰转换成特定字符相连
function toLowerLine(str, join) {
  join = join || '_'
  let temp = str.replace(/[A-Z]/g, function (match) {
    return join + match.toLowerCase();
  });
  if(temp.slice(0,1) === join){ //如果首字母是大写，执行replace时会多一个join，这里需要去掉
    temp = temp.slice(1);
  }
  return temp;
}


module.exports = {
  toCamel,
  toLowerLine,
}
