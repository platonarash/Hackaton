var azureSearchQueryApiKey = "82C2E107EEB733CB613EBD24977BCB0E";
var inSearch = false;
var q='*';
var subjectFacet='';
var contributorFacet='';
var currentPage = 1;

function execSearch()
{
	// Execute a search to lookup 
	if (inSearch == false) {
		inSearch= true;
		var q = $("#q").val();
		var searchQuery = encodeURIComponent(q);
		if (q.length = 0)
			searchQuery = '*';
		if (searchQuery.length == 0)
			searchQuery = '*';

		if (subjectFacet.length > 0)
			searchQuery += '&$filter=subjects/any(t: t eq \'' + encodeURIComponent(subjectFacet) + '\')';
		
		if (contributorFacet.length > 0) {
			if (subjectFacet.length == 0)
				searchQuery += '&$filter=';
			else
				searchQuery += ' and ';
			searchQuery += 'contributors/any(t: t eq \'' + encodeURIComponent(contributorFacet) + '\')';
		}
		
		var searchAPI = "https://azs-playground.search.windows.net/indexes/tate-art-collection/docs?$skip=" + (currentPage-1).toString() + "&$top=10&$select=acno,title,all_artists,thumbnailUrl,url,subjects,dateText,groupTitle,medium&api-version=2015-02-28&$count=true&facet=contributors&facet=subjects&search=" + searchQuery;
		$.ajax({
			url: searchAPI,
			beforeSend: function (request) {
				request.setRequestHeader("api-key", azureSearchQueryApiKey);
				request.setRequestHeader("Content-Type", "application/json");
				request.setRequestHeader("Accept", "application/json; odata.metadata=none");
			},
			type: "GET",
			success: function (data) {
				$( "#mediaContainer" ).html('');
				$( "#subjectsContainer" ).html('');
				$( "#contributorsContainer" ).html('');
				for (var item in data.value)
				{
					var id = data.value[item].acno;
					var title = data.value[item].title;
					var all_artists = data.value[item].all_artists;
					var url = data.value[item].url;
					var imageURL = data.value[item].thumbnailUrl;
					var subjects = data.value[item].subjects;
					var dateText = data.value[item].dateText;
					var groupTitle = data.value[item].groupTitle;
					var medium = data.value[item].medium;
					if (imageURL == null)
						imageURL = "no_image.png";
					
					// Build up the DIV
					var divContent = '<h2><a href="' + url + '">' + title + '</a></h2>';
					divContent += '<p class="lead">by ' + all_artists + '</p>';
					divContent += '<div class="row"><div class="col-md-4"><a href="' + url + '"><img class="img-responsive" src="' + imageURL + '" alt=""></a></div>';
					divContent += '<div class="col-md-8"><p><b>Medium:</b> ' + medium + '</p>';
					divContent += '<p><b>Subjects:</b><br>';
					for (var subject in subjects)
					{
						divContent += '<a href="javascript:void(0);" onclick="setSubjectFacet(\'' + subjects[subject] + '\');">[' + subjects[subject] + ']</a>&nbsp;';
					}
					divContent += '</p></div><hr></div><hr>';
					$( "#mediaContainer" ).append( divContent );
				}
				
				var subjects = '';
				for (var item in data["@search.facets"].subjects)
				{
					if (subjectFacet != data["@search.facets"].subjects[item].value) {
						$( "#subjectsContainer" ).append( '<li><a href="javascript:void(0);" onclick="setSubjectFacet(\'' + data["@search.facets"].subjects[item].value + '\');">' + data["@search.facets"].subjects[item].value + ' (' + data["@search.facets"].subjects[item].count + ')</a></li>' );

					}
				}
				
				var contributors = '';
				for (var item in data["@search.facets"].contributors)
				{
					if (contributorFacet != data["@search.facets"].contributors[item].value) {
						$( "#contributorsContainer" ).append( '<li><a href="javascript:void(0);" onclick="setContributorFacet(\'' + data["@search.facets"].contributors[item].value + '\');">' + data["@search.facets"].contributors[item].value + ' (' + data["@search.facets"].contributors[item].count + ')</a></li>' );
					}
				}
				
				// Update pagination
				UpdatePagination(data["@search.count"]);
				
			}
		}).done(function (data) {
			inSearch = false;
			// Check if the user changed the search term since this completed
			if (q != $("#q").val())
				execSearch();
		});
	}
}

function setContributorFacet(facet)
{
	// User clicked on a contributor facet
	contributorFacet=facet;
	if (facet != '')
		$("#currentContributor").html(facet + '<a href="javascript:void(0);" onclick="setContributorFacet(\'\');"> [X]</a>');
	else
		$("#currentContributor").html('');
	execSearch();
}

function setSubjectFacet(facet)
{
	// User clicked on a subject facet
	subjectFacet=facet;
	if (facet != '')
		$("#currentSubject").html(facet + '<a href="javascript:void(0);" onclick="setSubjectFacet(\'\');"> [X]</a>');
	else
		$("#currentSubject").html('');
	execSearch();
}

function UpdatePagination(docCount) {
	// Update the pagination
	var totalPages = Math.round(docCount / 10);
	// Set a max of 5 items and set the current page in middle of pages
	var startPage = currentPage;
	if ((startPage == 1) || (startPage == 2))
		startPage = 1;
	else
		startPage -= 2;

	var maxPage = startPage + 5;
	if (totalPages < maxPage)
		maxPage = totalPages + 1;
	var backPage = parseInt(currentPage) - 1;
	if (backPage < 1)
		backPage = 1;
	var forwardPage = parseInt(currentPage) + 1;

	var htmlString = '<li class=""><a href="javascript:void(0);" onclick="ChangePage(' + backPage +');" aria-label="Previous" id="PagingPrevious"><span aria-hidden="true">&laquo;</span></a></li>';
	for (var i = startPage; i < maxPage; i++) {
		if (i == currentPage)
			htmlString += '<li  class="active"><a href="#">' + i + '</a></li>';
		else
			htmlString += '<li><a href="javascript:void(0)" onclick="ChangePage(\'' + parseInt(i) + '\')">' + i + '</a></li>';
	}

	htmlString += '<li class=""><a href="javascript:void(0);" onclick="ChangePage(' + forwardPage + ');" aria-label="Next" id="PagingNext"><span aria-hidden="true">&raquo;</span></a></li>';
	$("#pagination").html(htmlString);

}
	
function ChangePage(page)
{
	// User clicked on the pagination
	currentPage = page;
	execSearch();
}

