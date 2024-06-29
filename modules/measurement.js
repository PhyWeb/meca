const $ = document.querySelector.bind(document);

Number.prototype.round = function(n) {
  const d = Math.pow(10, n);
  return Math.round((this + Number.EPSILON) * d) / d;
}

function isNumber(str) {
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
  !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

/*----------------------------------------------------------------------------------------------
--------------------------------------------MEASUREMENT------------------------------------------
----------------------------------------------------------------------------------------------*/
export default class MEASUREMENT {
  constructor() {
    this.table = $("#measurementTable");
    this.data = [];

    this.origin = {
      type: "topright",
      x: 0,
      y: 1
    }

    this.scaleSegment = {
      x1 : null,
      y1 : null,
      x2 : null,
      y2 : null
    }

    this.pointsPerFrame = 1;
    this.scale = 1;
    this.maxDecimals = 4;

  }   

  init(_decodedVideo){
    // HUUUUUM
    $("#segmentButton").classList.remove("active");
    $("#topright").classList.add("active");
    $("#topleft").classList.remove("active");
    $("#downright").classList.remove("active");
    $("#downleft").classList.remove("active");

    // Populate table
    this.table.innerHTML="";

    let titleRow = document.createElement('tr');
    let cell = document.createElement('th');
    cell.innerHTML = "t (s)"
    titleRow.appendChild(cell);
    for(let i = 1; i < this.pointsPerFrame + 1; i++){
      let cellx = document.createElement('th');
      cellx.innerHTML = this.pointsPerFrame > 1 ? "x" + i + " (m)" : "x" + " (m)";
      let celly = document.createElement('th');
      celly.innerHTML = this.pointsPerFrame > 1 ? "y" + i + " (m)" : "y" + " (m)";
      titleRow.appendChild(cellx);
      titleRow.appendChild(celly);
    }
    this.table.appendChild(titleRow);

    _decodedVideo.frames.forEach((value,index)=>{
      // create the data object
      let l = [];
      let m = [];

      for(let i = 0; i < this.pointsPerFrame; i++){
        l[i]="";
        m[i]="";
      }

      this.data[index] = {
        t: (_decodedVideo.duration / _decodedVideo.frames.length) * index,
        xs: l,
        ys: m
      }

      let row = document.createElement('tr');

      // t column
      let cell = document.createElement('td');
      let input = document.createElement('input');
      input.placeholder = "0";
      input.type = "text";
      input.value = Math.round(this.data[index].t) / 1000;
      input.className = "measurementInput";
      input.autocomplete="off";
      cell.appendChild(input);
      row.appendChild(cell)

      // x&y columns
      for(let i = 1; i < this.pointsPerFrame + 1; i++){
        let xcell = document.createElement('td');
        let xinput = document.createElement('input');
        xinput.type="text";
        xinput.className="measurementInput";
        xinput.id = "x" + i + index;
        xinput.autocomplete="off";
        xcell.appendChild(xinput);
        row.appendChild(xcell)

        let ycell = document.createElement('td');
        let yinput = document.createElement('input');
        yinput.type="text";
        yinput.className="measurementInput";
        yinput.id = "y" + i + index;
        yinput.autocomplete="off";
        ycell.appendChild(yinput);
        row.appendChild(ycell)
      }
      this.table.appendChild(row);
    });
  }

  changeValue(_index, _x, _y){
    this.data[_index].xs[0] = _x; // TODO permettre les autres points par frame
    this.data[_index].ys[0] = _y;

    this.updateTable();
  }

  updateScale(){
    this.scale = 1;
    if(this.scaleSegment.x1 != null && this.scaleSegment.x2 != null && this.scaleSegment.y1 != null && this.scaleSegment.y2 != null){
      debugger;
      if(isNumber($("#scaleInput").value) == true){
        this.scale = $("#scaleInput").value / Math.sqrt(Math.pow(this.scaleSegment.x2 - this.scaleSegment.x1 , 2) + Math.pow(this.scaleSegment.y2 - this.scaleSegment.y1 , 2));
      }
    }
    console.log(this.scale)
  }

  updateTable(){
    this.updateScale()
    for(let i = 0; i < this.table.children.length - 1; i++){
      if(this.data[i].xs[0] != ""){
        $("#" + "x1" + i).value = this.scalex(this.data[i].xs[0]);
      }
       // TODO permettre les autres points par frame
      if(this.data[i].ys[0] != ""){
        $("#" + "y1" + i).value = this.scaley(this.data[i].ys[0]);
      }
    }
  }

  scalex(_x){
    let x = 0;
    switch(this.origin.type){
      case "topright":
        x = (_x - this.origin.x) * this.scale;
        break;
      case "topleft":
        x = - (_x - this.origin.x) * this.scale;
        break;
      case "downright":
        x = (_x - this.origin.x) * this.scale;
        break;
      case "downleft":
        x = - (_x - this.origin.x) * this.scale;
        break;
    }
    return x.round(this.maxDecimals);
  }

  scaley(_y){
    let y = 0;
    switch(this.origin.type){
      case "topright":
        y = - (_y - this.origin.y) * this.scale;
        break;
      case "topleft":
        y = - (_y - this.origin.y) * this.scale;
        break;
      case "downright":
        y = (_y - this.origin.y) * this.scale;
        break;
      case "downleft":
        y = (_y - this.origin.y) * this.scale;
        break;
    }
    return y;
  }

  createCSV(){
    this.updateScale()

    let csv = []
    let row = []

    // titles
    row.push("t");
    for(let i = 1; i < this.pointsPerFrame + 1; i++){
      row.push("x" + i);
      row.push("y" + i);
    }

    csv.push(row.join(","));

    // datas
    this.data.forEach((e)=>{
      // TODO check if empty
      let ro = [];
      ro.push(e.t / 1000);
      let emptyFlag = false;
      for(let i = 0; i < e.xs.length; i++){
        if(e.xs[i] === "" || e.ys[i] === ""){
          emptyFlag = true;
        }
        ro.push(this.scalex(e.xs[i]));
        ro.push(this.scaley(e.ys[i]));
      }
      if(emptyFlag == false){
        csv.push(ro);
      }
      
    });

    this.downloadCSV(csv.join("\n"))
  }

  async downloadCSV(_data){
    const blob = new Blob([_data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pointage.csv';
    a.click();

  }
}