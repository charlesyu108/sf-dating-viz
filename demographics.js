/**
 * This is the code for the demographics visualization.
 * Some of this code is borrowed from https://bl.ocks.org/pbeshai/65420c8d722cdbb0600b276c3adcc6e8.
 */

var bodyDOM = document.body.getBoundingClientRect();
// Define Canvas Related params
const demo_width = bodyDOM.width * 0.60;
const demo_height = 600;
var pointWidth = 2;
var pointHeight = 2;
const duration = 1500;
const ease = d3.easeCubic;
const timer = d3.timer(x => x); // Dummy callback

// Building the canvas
var canvas = d3.select('#demographics-div').append('canvas')
  .attr("id", "canvas")
  .attr('width', demo_width)
  .attr('height', demo_height)
  .style('width', `${demo_width}px`)
  .style('height', `${demo_height}px`);

var canvasDOM = document.getElementById("canvas").getBoundingClientRect();
var demodivDOM = document.getElementById("demographics-div").getBoundingClientRect();

// SVG overlay
var svg = d3.select('#demographics-div')
    .append('svg')
      .attr('width', canvasDOM.width)
      .attr('height', canvasDOM.height)
      .style("position", "absolute")
      .style("top", canvasDOM.top-demodivDOM.top)
      .style("left", canvasDOM.left-demodivDOM.left);

var demotooltip = d3.select("body").append("div")
    .attr("class", "demotooltip")
    .style("display", "none");

// Load in Profiles data
d3.queue().defer(d3.csv, "meep.csv").await(makeViz);

function makeViz(error, profiles) {

  //makeViz globals
  const points = profiles;
  var pointsOnScreen = true;

  var blue = "#61D6FF";
  var pink = "#FC6C6E";
  // Init points
  points.forEach(function(d) {
    d.color = d.sex == "m" ? blue : pink;
    d.display = "visible";
  });

  // Start points at bottom of screen
  toBottom(points);
  drawPoints();
  animatePoints(randomLayout);

  svg.on("mousemove", mousemoveActions);

  // // Button actions
  // d3.select("#gender")
  //   .on("click", _ => {
  //     animatePoints(genderLayout);
  //     genderLayoutSVG(points);
  //   });
  //
  // d3.select("#unsort")
  //   .on("click", _ => animatePoints(randomLayout));

  // d3.select("#age")
  //   .on("click", _ => {
  //     animatePoints(randomLayout);
  //     setTimeout( _ => {
  //       animatePoints(toBottom);
  //       setTimeout(x => {pointsOff(); clearSVG(); showAgeDist()}, 1500);
  //     },1500)
  //   });

  // d3.select("#orientation")
  //   .on("click", _ => {
  //     animatePoints(randomLayout);
  //     setTimeout( _ => {
  //       animatePoints(toBottom);
  //       setTimeout(_ => {pointsOff(); clearSVG(); showOrientationDist()}, 1500);
  //     },1500)
  //
  //   });

  d3.select("#jobs")
    .on("click", _ => {
      animatePoints(randomLayout);
      setTimeout( _ => {
        animatePoints(toBottom);
        setTimeout(_ => {pointsOff(); clearSVG(); showJobDist()}, 1500);
      },1500)

    });

  // Making filters
  var filters = [["sex", "m"], ["sex", "f"], ["religion", "christianity"], ["religion", "islam"]]

  function onCheckboxChange(){
    filts = [];
    boxes = document.querySelectorAll(".profile-filter");
    Array.from(boxes).forEach(d => {
      box = d3.select(d);
      if (box.property("checked")){
         filts.push(pointsFilter(box.attr("field"), box.attr("value")))
       }
     });

   filterPoints(filts);
   drawPoints();

  }

  filters.forEach(d => {
    var div = d3.select("#filters").append("div");

    div.append("input")
    .attr("type", "checkbox")
    .attr("class", "profile-filter")
    .attr("id", (d[0]+"-"+d[1]))
    .attr("field", d[0])
    .attr("value", d[1])
    .on("change", onCheckboxChange);

    div.append("label")
    .attr("for", (d[0]+"-"+d[1]))
    .html(`${d[0]} (${d[1]})`);

  });

  /* >>>>>>>>>>>>>> ====== BEGIN utility functions ======= <<<<<<<<<<<<<<<<<<< */
  function filterPoints(filters) {
    if (filters.length == 0){
      points.forEach(pt => pt.display = "visible");
      return;
    }
    var filtFn = filters.reduce((a,b) => (x => a(x) && b(x)));
    points.forEach(pt => filtFn(pt) ? pt.display = "visible": pt.display = "invisible")
  }

  function pointsFilter(field, val) {
    return (d => d[field] == val);
  }

  function clearSVG() {
    svg.selectAll("g").remove();
  }

  function clearCanvas() {
    ctx = canvas.node().getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, demo_width, demo_height);
    ctx.restore();
  }

  function mousemoveActions() {
    if (!pointsOnScreen) return;
    demodivDOM = document.getElementById("demographics-div").getBoundingClientRect();
    var xpt = d3.event.clientX - demodivDOM.left;
    var ypt = d3.event.clientY - demodivDOM.top;

    filt = points.filter(pt =>
      (pt.x >= xpt-pointWidth)&&
      (pt.x <= xpt+pointWidth)&&
      (pt.y >= ypt-pointHeight)&&
      (pt.y <= ypt+pointHeight)&&
      (pt.display == "visible")
    );

    if (filt.length > 0){
      var select = filt[0];
      demotooltip
      .html(select.sex +" "+select.age+ "<br> Essay0: <br>"+select.essay0)
      .style("display", "inline")
      .style("top", (d3.event.pageY -34)+ "px")
      .style("left", (d3.event.pageX-12) + "px")
    }
    else {
      demotooltip.style("display", "none");
    }
  }

  function pointsOn(){
    points.forEach(pt => pt.display = "visible");
    pointsOnScreen = true;
  }

  function pointsOff(){
    points.forEach(pt => pt.display = "invisible");
    pointsOnScreen = false;
  }

  // draw the points based on their current layout
  function drawPoints() {
    ctx = canvas.node().getContext('2d');
    ctx.save();

    // erase what is on the canvas currently
    ctx.clearRect(0, 0, demo_width, demo_height);

    // draw each point as a rectangle
    for (let i = 0; i < points.length; ++i) {
      point = points[i];
      if (point.display == "visible"){
        ctx.fillStyle = point.color;
        ctx.fillRect(point.x, point.y, pointWidth, pointHeight);
      }
      // ctx.fillStyle = point.color;
      // ctx.fillRect(point.x, point.y, pointWidth, pointHeight);
    }
    ctx.restore();
  }

  function animatePoints(newLayout) {
    clearSVG();
    pointsOn();
    // Setting souce points
    points.forEach(point => {
      point.sx = point.x;
      point.sy = point.y;
    });
    newLayout(points);
    // Setting dest points
    points.forEach(point => {
      point.tx = point.x;
      point.ty = point.y;
    });

    timer.restart((elapsed) => {
      // compute how far through the animation we are (0 to 1)
      const t = Math.min(1, ease(elapsed / duration));
      // update point positions (interpolate between source and target)
      points.forEach(point => {
        point.x = point.sx * (1 - t) + point.tx * t;
        point.y = point.sy * (1 - t) + point.ty * t;
      });
      drawPoints(); // update what is drawn on screen
      // if this animation is over, stop this timer since we are done animating.
      if (t >= 1) {
        timer.stop();
      }
    });
  }

  function showAgeDist() {
    var agePoints = [];
    for( i = 18; i <= 100; i ++){
      agePoints.push({"age": i, "count": 0, "m": 0, "f": 0});
    }

    points.forEach(d =>{
      if (d.age >= 18 && d.age <= 100){
        agePoints[d.age-18].count += 1;
        d.sex =="m"? agePoints[d.age-18].m += 1 : agePoints[d.age-18].f += 1;
      }
    });
    min_age = 18;
    max_age = 69;
    max_count = d3.max(agePoints, x => x.count);
    padding_x = 50;
    padding_y = 100;
    barWidth = demo_width / (max_age-min_age);
    heightUnit = (demo_height - padding_y) / max_count;

    var x_scale = d3.scale.linear()
      .domain([18, 100])
      .range([padding_x, width]);

    var y_scale = d3.scale.linear()
      .domain([0, max_count])
      .range([demo_height, padding_y]);

    var chart = svg.append("g")
      .attr("width", demo_width)
      .attr("height", demo_height);

    var bar = chart.selectAll("g")
      .data(agePoints)
      .enter().append("g")
      .attr("transform", (d,i) => "translate(" + (i * barWidth + padding_x) + "," + 0 + ")");

    bar.append("rect")
      .attr("width", barWidth)
      .attr("y", y_scale(0))
      .transition().duration(1000)
        .attr("y", d => y_scale(d.m))
        .attr("height", d => d.m * heightUnit)
        .attr("stroke", "white")
        .style("fill", blue);

    bar.append("rect")
      .attr("width", barWidth)
      .attr("y", y_scale(0))
      .transition().duration(1000)
        .attr("y", d => y_scale(d.count))
        .attr("height", d => d.f * heightUnit)
        .attr("stroke", "white")
        .style("fill", pink);

    bar.on("mousemove", d => {
      demotooltip
      .style("display", "inline")
      .style("top", (d3.event.pageY-34)+ "px")
      .style("left", (d3.event.pageX-12) + "px")
      .html(`Age ${d.age} <br> Males ${d.m} <br> Females ${d.f}`)
    })
    .on("mouseout", d => {
      demotooltip
      .style("display", "none")
    });

    ctx = canvas.node().getContext('2d');
    ctx.save();
     // erase what is on the canvas currently
    ctx.clearRect(0, 0, demo_width, demo_height);
    ctx.restore();
  }

  function showOrientationDist() {

    ctx = canvas.node().getContext('2d');
    ctx.save();
     // erase what is on the canvas currently
    ctx.clearRect(0, 0, demo_width, demo_height);
    ctx.restore();

    var orientations = ["gay", "straight", "bisexual"];
    var groups = [];

    orientations.forEach(o =>{
      groups.push({"orientation":o, "sex": "m", "count": 0 });
      groups.push({"orientation":o, "sex": "f", "count": 0 });
    });
    points.forEach(d => {
      var group = groups.filter(g => g.orientation == d.orientation && d.sex == g.sex);
      if (group.length > 0) group[0].count += 1;
    });

    var max_r = 150;

    var rscale = d3.scale.linear()
    .domain([1, d3.max(groups, x => x.count)])
    .range([0, max_r])

    var viz = svg.append("g");

    var groupsEnter = viz.selectAll("g")
    .data(groups).enter();

    var circles = groupsEnter.append("circle")
      .style("fill", d => d.sex == "m"? blue: pink)
      .attr("cx", d => d.sex == "m"? demo_width/2 - max_r: demo_width/2 + max_r)
      .attr("cy", demo_height)
      .attr("r", 0)

    circles.transition().duration(1500)
    .attr("cx", d => d.sex == "m"? demo_width/2 - max_r: demo_width/2 + max_r)
    .attr("cy", (d,i) => Math.floor(i/2) * height/3 + 100)
    .attr("r", d => rscale(d.count));

    circles
    .on("mousemove", d => {
      demotooltip
      .style("display", "inline")
      .style("top", (d3.event.clientY-34)+ "px")
      .style("left", (d3.event.clientX-12) + "px")
      .html(`${d.orientation}, ${d.sex} <br> Count: ${d.count}`)
    })
    .on("mouseout", d => {
      demotooltip
      .style("display", "none")
    });

  }

  function showJobDist() {

    ctx = canvas.node().getContext('2d');
    ctx.save();
     // erase what is on the canvas currently
    ctx.clearRect(0, 0, demo_width, demo_height);
    ctx.restore();

    // var jobs = ["student", "art/music/writing", "banking/finance", "administration", "technology", "construction", "education", "entertainment/media", "management", "hospitality", "law", "medicine", "military", "politics/government", "sales/marketing", "science/engineering", "transportation", "unemployed", "other", "rather not say", "retire"];
    jobs = ['artistic / musical / writer', 'banking / financial / real estate', 'clerical / administrative', 'computer / hardware / software', 'construction / craftsmanship', 'education / academia', 'entertainment / media', 'executive / management','hospitality / travel','law / legal services','medicine / health','military','other','political / government','rather not say','retired','sales / marketing / biz dev','science / tech / engineering','student','transportation','unemployed']
    var groups = [];

    jobs.forEach(o =>{
      groups.push({"job":o, "sex": "m", "count": 0 });
      groups.push({"job":o, "sex": "f", "count": 0 });
    });
    points.forEach(d => {
      var group = groups.filter(g => g.job == d.job && d.sex == g.sex);
      if (group.length > 0) group[0].count += 1;
    });

    var max_r = 150;

    var rscale = d3.scale.linear()
    .domain([1, d3.max(groups, x => x.count)])
    .range([0, max_r])

    var viz = svg.append("g");

    var groupsEnter = viz.selectAll("g")
    .data(groups).enter();

    var circles = groupsEnter.append("circle")
      .style("fill", d => d.sex == "m"? blue: pink)
      .attr("cx", d => d.sex == "m"? demo_width/2 - max_r: demo_width/2 + max_r)
      .attr("cy", demo_height)
      .attr("r", 0)

    circles.transition().duration(1500)
    .attr("cx", d => d.sex == "m"? demo_width/2 - max_r: demo_width/2 + max_r)
    .attr("cy", (d,i) => Math.floor(i/2) * height/3 + 100)
    .attr("r", d => rscale(d.count));

    circles
    .on("mousemove", d => {
      demotooltip
      .style("display", "inline")
      .style("top", (d3.event.clientY-34)+ "px")
      .style("left", (d3.event.clientX-12) + "px")
      .html(`${d.job}, ${d.sex} <br> Count: ${d.count}`)
    })
    .on("mouseout", d => {
      demotooltip
      .style("display", "none")
    });
  }

  function genderLayoutSVG(points){
    male = points.filter(x => x.sex == "m");
    female = points.filter(x => x.sex == "f");
    var labels = svg.append("g");
    labels.append("text")
      .text("Male Users: " + male.length)
      .attr("x", 100)
      .attr("y", demo_height + 20);
    labels.append("text")
        .text("Female Users: " + female.length)
        .attr("x", 500)
        .attr("y", demo_height + 20);
  }

  // BEGIN On scroll interactions

  // DEFINE ranges for each content change
  introRange = [0, 300];
  ageRange = [300, 800];
  orientationRange = [800, 1300];
  jobRange = [1300, 1500];
  genderRange = [1500, 2000];


  var lastY = document.documentElement.scrollTop;
  function triggerFn(range, curr) {
    var on = (curr > range[0] && curr < range[1] &&
      !(lastY > range[0] && lastY < range[1]));

      if (on){
        d3.selectAll(".section")
        .style("opacity", 0.2);
      }

    return on;
   }

  window.addEventListener("scroll", _ => {
   var scrolltop = document.documentElement.scrollTop;

   // Intro
   if (triggerFn(introRange, scrolltop)){
     animatePoints(randomLayout);
     d3.select("#intro-section")
     .style("opacity", 1);
   }



   // GENDER
   if (triggerFn(genderRange, scrolltop)){
     animatePoints(genderLayout);
     genderLayoutSVG(points);
     d3.select("#gender-section")
     .style("opacity", 1);
   }
    // AGE
   if (triggerFn(ageRange, scrolltop)){
     animatePoints(randomLayout);
     setTimeout( _ => {
       animatePoints(toBottom);
       setTimeout(x => {pointsOff(); clearSVG(); showAgeDist()}, 1500);
     },1500);
     d3.select("#age-section")
     .style("opacity", 1);
   }

   //Orientation
   if (triggerFn(orientationRange, scrolltop)){
       animatePoints(randomLayout);
       setTimeout( _ => {
         animatePoints(toBottom);
         setTimeout(_ => {pointsOff(); clearSVG(); showOrientationDist()}, 1500);
       },1500)
       d3.select("#orientation-section")
       .style("opacity", 1);
    }

    //Jobs
    if (triggerFn(jobRange, scrolltop)){
        animatePoints(randomLayout);
        setTimeout( _ => {
          animatePoints(toBottom);
          setTimeout(_ => {pointsOff(); clearSVG(); showJobDist()}, 1500);
        },1500)
        d3.select("#job-section")
        .style("opacity", 1);
     }


   lastY = scrolltop;
  })



} // End of makeViz


/**
 * >>>>>>>>>>>>>> ====== BEGIN Layout functions ======= <<<<<<<<<<<<<<<<<<<
 * Each layout fn defines new point arrangement.
 * Each fn takes in an argument @param points of type Object [].
 * NOTE: Elements of `points` will have their 'x' and 'y' fields mutated.
 */

function genderLayout(points) {
  max_x = demo_width / pointWidth / 2;
  max_y = demo_height / pointHeight / 2;
  x = 0;
  y = 0;

  male = points.filter(x => x.sex == "m");
  female = points.filter(x => x.sex == "f");
  points = male.concat(female);
  points.forEach(function(d) {
    d.x = 2 * pointWidth * x;
    d.y = 2 * pointHeight * y;
    y += 1;
    if (y > max_y) {
      y = 0;
      x += 1;
    }
  });
  return points;
}

function randomLayout(points) {
  points.forEach(function(d) {
    d.x = Math.random() * (demo_width - pointWidth);
    d.y = Math.random() * (demo_height - pointHeight);
  });
  return points;
}

function toBottom(points) {
  points.forEach(function(d) {
    d.x = Math.random() * (demo_width - pointWidth);
    d.y = demo_height - pointHeight;
  });
  return points;
}

function toGrid(points){
  max_x = demo_width / pointWidth / 4;
  max_y = demo_height / pointHeight / 2;
  x = 0;
  y = 10;
  points.forEach(function(d) {
    d.x = 2 * pointWidth * x;
    d.y = 2 * pointHeight * y;
    y += 1;
    if (y > max_y) {
      y = 10;
      x += 1;
    }
  });
  return points;
}

function toCenter(points) {
  points.forEach(function(d) {
    d.x = demo_width/2;
    d.y = demo_height/2;
  });
  return points;
}
