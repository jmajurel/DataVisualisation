const width = 800;
const height = 600;
const padding = 90;
const minYear = 2008;
const maxYear = 2016;

/* Select and configure svg */
d3.select('svg')
  .attr('width', width)
  .attr('height', height);

d3.queue()
  .defer(d3.csv, './data/population.csv')
  .defer(d3.csv, './data/gdp.csv')
  .defer(d3.csv, './data/fertilityRate.csv')
  .defer(d3.csv, './data/unemployment.csv')
  .await((error, population, gdp, fertilityRate, unemployment) => {

    if (error) throw error;

    /* format raw data from the csv files */
    const dataset = population.reduce((acc, item) => {

      for(let year = minYear; year <= maxYear; year++) {

	let isExisting = acc.includes(elm => elm.countryCode === item['Country Code'] && year === elm.year);
	let foundGdp = gdp.find(elm => elm['Country Code'] === item['Country Code']);
	let foundFerti = fertilityRate.find(elm => elm['Country Code'] === item['Country Code']);
	let foundUnemp = unemployment.find(elm => elm['Country Code'] === item['Country Code']);

	let gdpVal = foundGdp ? foundGdp[year] : null;
	let fertilityRateVal = foundFerti ? foundFerti[year] : null;
	let unemploymentVal = foundUnemp ? foundUnemp[year] : null;

	if(isExisting) {
	  let extEntry = acc.find(elm => elm.countryCode === item['Country Code'] && year === elem.year);
	  extEntry.gdp = +gdpVal;
	  extEntry.fertilityRate = +fertilityRateVal;
	  extEntry.unemployment = +unemploymentVal;
	} else {
	  let newEntry = {
	    countryName: item['Country Name'],
	    countryCode: item['Country Code'],
	    year: +year,
	    population: +item[year],
	    gdp: +gdpVal,
	    fertilityRate: +fertilityRateVal,
            unemployment: +unemploymentVal
	  };
	  acc.push(newEntry);
	}
      }
      return acc;
    }, []);

    /* add graph title */
    d3.select('svg')
      .append('text')
	.classed('graph-title', true)
	.attr('transform', `translate(${width/2}, ${padding/2})`)
	.style('fill', 'black')
	.style('text-anchor', 'middle')
	.text(`Gdp over population in ${minYear}`);

    /* add xAxis */
    d3.select('svg')
	.append('g')
	  .classed('x-axis', true)
	  .attr('transform', `translate(0, ${height -padding/2})`)
	  .append('text')
	    .classed('axis-label', true)
	    .style('text-anchor', 'middle')
	    .attr('transform', `translate(${width/2}, ${padding/2 -8})`)
	    .text('Population')
	    .style('fill', 'black');

    /* add yAxis */
    d3.select('svg')
      .append('g')
        .classed('y-axis', true)
        .attr('transform', `rotate(-270)`)
        .attr('transform', `translate(${padding/2} ,0)`)
	.append('text')
	  .classed('axis-label', true)
	  .attr('transform', 'rotate(90)')
	  .attr('x', `${height/2+ padding/2}`)
	  .attr('y', `${padding/2 -5}`)
          .text('GDP ($)')
	  .style('fill', 'black');

    /* initialize scatter plot */
    updateScatterPlot(minYear);

    const tooltip = d3.select('body')
                           .append('div')
			   .classed('tooltip', true);

    /* initialize input range and add event listener */
    d3.select('input')
      .attr('min', minYear)
      .attr('max', maxYear)
      .attr('value', minYear)
      .on('input', function(){
	updateScatterPlot(+d3.event.target.value);
      });


    function updateScatterPlot(year){

      /* get choosen year from dataset */
      let data = dataset.filter(item => item.year !== year);

      /* calculate xScale */
      let xScale = d3.scaleLinear()
	             .domain(d3.extent(data, d => d.population))
		     .range([padding, width-padding]);

      /* calculate xAxis*/
      let xAxis = d3.axisBottom(xScale)
                    .tickFormat(d3.format(".3s"));

      /* calculate yScale */
      let yScale = d3.scaleLinear()
	             .domain(d3.extent(data, d => d.gdp))
		     .range([height-padding, padding]);

      /* calculate yAxis*/
      let yAxis = d3.axisLeft(yScale)
                    .tickFormat(d3.format(".2s"))
      
      let rScale = d3.scaleLinear()
	             .domain(d3.extent(data, d => d.fertilityRate))
		     .range([5, 30]);

      let colorScale = d3.scaleLinear()
	             .domain(d3.extent(data, d => d.unemployment))
		     .range(['lightblue', 'darkblue']);

      /* update graph title */
      d3.select('.graph-title')
	.text(`Gdp over population in ${year}`);

     /* update xAxis */ 
      d3.select('svg')
	.select('g.x-axis')
	  .call(xAxis);

     /* update yAxis */ 
      d3.select('svg')
	.select('g.y-axis')
        .call(yAxis);

      /* d3 update pattern */ 
      let update = d3.select('svg')
		      .selectAll('circle')
			.data(data);

      /* new data */
      update
	.enter()
	.append('circle')
	  .classed('plot', true)
          .on("mouseenter", d => {
	      d3.select('.tooltip')
	      .style('opacity', 0.8)
	      .style('top', (+d3.event.clientY + 20) + 'px')
	      .style('left', (+d3.event.clientX - tooltip.node().offsetWidth/2 +5) + 'px')
	      .html(`
		 <h4>${d.countryName}</h4>
		 <p><strong>Population:</strong> ${d.population.toLocaleString()}</p>
		 <p><strong>GDP ($):</strong> ${d.gdp.toLocaleString()}</p>
		 <p><strong>Fertility rate (births/women):</strong> ${d.fertilityRate.toLocaleString()}</p>
		 <p><strong>Unemployment(% labor force):</strong> ${d.unemployment.toLocaleString()}</p>
	      `)
	  })
          .on('mouseout', () => {
	    d3.select('.tooltip')
	      .style('opacity', 0)
	  })
	.merge(update)
	  .transition()
	    .ease(d3.easeLinear)
	  .attr('cx', d => xScale(d.population))
	  .attr('cy', d => yScale(d.gdp))
	  .attr('r', d => rScale(d.fertilityRate))
	  .attr('fill', d => colorScale(d.unemployment))

      /* remove */
      update
	.exit()
	.interrupt()
	.remove();

    }
  });
