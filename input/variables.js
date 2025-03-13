let i = 0;
let t = 10;

function add() {
  let iIsLower = i < t;
  let f = 0 == 1;

  if (iIsLower == f) {
    return;
  }

  console.log("valor de i:", i);
  
  i = i + 1;

  return add();
}

add();

return i;