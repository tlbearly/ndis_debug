//
        // Map Layers read from config.xml
        //
        /*const layer1 = new MapImageLayer({
            url: "https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/HuntingAtlas_Base_Map/MapServer",
            title: "Hunter Reference",
            visible: true,
            opacity: 0.8
        });
        const layer2 = new MapImageLayer({
            url: "https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/HuntingAtlas_BigGame_Map/MapServer",
            title: "Game Species",
            visible: true,
            opacity: 0.7
        });
        layer1.load()
          .then(() => {
              console.log("Hunter Reference loaded");
          })
          .catch((error) => {
              console.error(error);
          });
         

        // Create GroupLayer with the two MapImageLayers created above
        // as children layers.
*/
        /*const demographicGroupLayer = new GroupLayer({
          title: "US Demographics",
          visible: true,
          visibilityMode: "exclusive",
          layers: [USALayer, censusLayer],
          opacity: 0.75
        });*/

        // Create a map and add the group layer to it

       /* map = new Map({
          basemap: "streets-vector",
          layers: [layer2]
        });
        
        map.layers.add(layer1);

        // initial extent
        ext=[-12350000, 4250000, -11150000, 5250000];
        initExtent = new Extent({
            "xmin": parseFloat(ext[0]),
            "ymin": parseFloat(ext[1]),
            "xmax": parseFloat(ext[2]),
            "ymax": parseFloat(ext[3]),
            "spatialReference": {
                "wkid": wkid
            }
        });
		
        // Add the map to a MapView
        view = new MapView({
          container: "mapDiv",
          extent: initExtent,
          map: map,
          constraints: {
            maxScale: 9244649,
            minScale: 1128
          }
        });



        // Update mouse coordinates
        view.on('pointer-move', (event)=>{
          showCoordinates(event);  
        });
        // Identify
        view.on('click', (event)=>{
          console.log("Identify");
        });

        // Watch for map scale change
        // Providing `initial: true` in ReactiveWatchOptions
        // checks immediately after initialization
        // Equivalent to watchUtils.init()
        reactiveUtils.watch(
          () => view.zoom,
            () => {
              showMapScale(parseInt(view.scale));
            },
          {
            initial: true
        });
        */
        //-----------------
        //   Overview Map
        //-----------------
        /*var extentGraphic, dragging=false;
        // Create another Map, to be used in the overview "view"
        const ovMap = new Map({
          basemap: "streets-vector"
        });

        const overviewDiv = document.getElementById("overviewDiv");

        const overviewMap = new MapView({
          container: "overviewDiv",
          map: ovMap,
          extent: initExtent,
          constraints: {
            rotationEnabled: false
          }
        });
        const ovExpand = new Expand({
              view: view,
              content: overviewDiv,
              id: "overviewBtn",
              expandTooltip: "Expand Overview Map",
              expandIconClass: "esri-icon-overview-arrow-bottom-left",
              collapseIconClass: "esri-collapse__icon esri-expand__icon--expanded esri-icon-collapse",
              label: "Show Overview"
            });
        view.ui.add(ovExpand, "top-right");


        // set up initial extent on overview map
        const extentDebouncer = promiseUtils.debounce(() => {
          if (view.stationary) {
            overviewMap.goTo({
              center: view.center,
              //extent: view.extent.expand(2)
              scale:view.scale * 2 *
                Math.max(
                  view.width / overviewMap.width,
                  view.height / overviewMap.height
                )
            });
          }
        });*/

        /*function setupOverviewMap() {
          // Overview map extent graphic
          extentGraphic = new Graphic({
            geometry: null,
            symbol: {
              type: "simple-fill",
              color: [0, 0, 0, 0.5],
              outline: null
            }
          });
          overviewMap.graphics.add(extentGraphic);
          
         // Disable all zoom gestures on the overview map
          overviewMap.popup.dockEnabled = true;
          // Removes the zoom action on the popup
          overviewMap.popup.actions = [];
          // stops propagation of default behavior when an event fires
          //function stopEvtPropagation(event) {
          //  event.stopPropagation();
          //}
          // exlude the zoom widget from the default UI
          // Remove the default widgets
          overviewMap.ui.components = [];
          // disable mouse wheel scroll zooming on the view
          overviewMap.on("mouse-wheel", function(event){
            if(overviewDiv.style.visibility == "hidden")return;
            event.stopPropagation();
          });
          // disable zooming via double-click on the view
          overviewMap.on("double-click", function(event){
            if(overviewDiv.style.visibility == "hidden")return;
            event.stopPropagation();
          });
          // disable zooming out via double-click + Control on the view
          overviewMap.on("double-click", ["Control"], function(event){
            if(overviewDiv.style.visibility == "hidden")return;
            event.stopPropagation();
          });

          // pan the overview graphic to move main map
          // disables pinch-zoom and panning on the view
          var start, update, diffX, diffY;
          let tempGraphic;
          let draggingGraphic;
          overviewMap.on("drag",(event) => {
            if(overviewDiv.style.visibility == "hidden")return;
            if (event.action === "start") {
                // if this is the starting of the drag, do a hitTest
                overviewMap.hitTest(event).then(resp => {
                    if (resp.results[0].graphic && resp.results[0].graphic.geometry && resp.results[0].graphic.geometry.type === 'extent'){
                      event.stopPropagation();
                      dragging=true;
                      console.log("start dragging"); 
                      // if the hitTest returns an extent graphic, set dragginGraphic
                      draggingGraphic = resp.results[0].graphic;
                      start =  overviewMap.toMap({x: event.x, y: event.y});
                    }
                });
            }
            if (event.action === "update") {
                // on drag update events, only continue if a draggingGraphic is set
                if (draggingGraphic){
                    event.stopPropagation();
                    console.log("update dragging");
                    // if there is a tempGraphic, remove it
                    if (tempGraphic) {
                        overviewMap.graphics.remove(tempGraphic);
                    } else {
                        // if there is no tempGraphic, this is the first update event, so remove original graphic
                        overviewMap.graphics.remove(draggingGraphic);
                    }
                    // create new temp graphic and add it
                    tempGraphic = draggingGraphic.clone();
                    // Calculate new extent
                    update = overviewMap.toMap({x: event.x, y: event.y});
                    diffX = update.x - start.x;
                    diffY = update.y - start.y;
                    start = update;
                    const extent = extentGraphic.geometry;
                    extent.xmin += diffX;
                    extent.xmax += diffX; 
                    extent.ymin += diffY;
                    extent.ymax += diffY; 
                    tempGraphic.geometry = extent;
                    overviewMap.graphics.add(tempGraphic);
                }
            }
            else if (event.action === "end") {
                // on drag end, continue only if there is a draggingGraphic
                if (draggingGraphic){
                  event.stopPropagation();
                  console.log("end dragging");
                  // rm temp
                  if (tempGraphic) overviewMap.graphics.remove(tempGraphic);
                  // fix double image bug
                  if (draggingGraphic) overviewMap.graphics.remove(draggingGraphic);
                  // create new graphic based on original dragging graphic
                  extentGraphic = draggingGraphic.clone();
                  if (tempGraphic)
                    extentGraphic.geometry = tempGraphic.geometry.clone();
                  else
                    extentGraphic.geometry = draggingGraphic.geometry.clone();
                  
                  // add replacement graphic
                  overviewMap.graphics.add(extentGraphic);
                  
                  // reset vars
                  draggingGraphic = null;
                  tempGraphic = null;
                  
                  // Adjust main map
                  view.center = extentGraphic.geometry.extent.center;
                  dragging=false;
                }
            }
          });

          // disable the view's zoom box to prevent the Shift + drag
          // and Shift + Control + drag zoom gestures.
          overviewMap.on("drag", ["Shift"], function(event){
            console.log("shift-drag");
            if(overviewDiv.style.visibility == "hidden")return;
            event.stopPropagation();
          });
          overviewMap.on("drag", ["Shift", "Control"], function(event){
            if(overviewDiv.style.visibility == "hidden")return;
            event.stopPropagation();
          });

          // prevents zooming with the + and - keys
          overviewMap.on("key-down", (event) => {
            if(overviewDiv.style.visibility == "hidden")return;
            const prohibitedKeys = ["+", "-", "Shift", "_", "=", "ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft"];
            const keyPressed = event.key;
            if (prohibitedKeys.indexOf(keyPressed) !== -1) {
              event.stopPropagation();
            }
          });
          
          reactiveUtils.watch(
            () => view.extent,
            (extent) => {
              // Sync the overview map location
              // whenever the view is stationary
              if(dragging) return;
              extentDebouncer().then(() => {
                extentGraphic.geometry = extent;
              });
              overviewMap.scale = view.scale * 2 * Math.max(
                  view.width / overviewMap.width,
                  view.height / overviewMap.height
                );
              overviewMap.center = view.center;
            },
            {
              initial: true
            }
          );
        }*/


        // Creates actions in the LayerList.
        /*function defineActions(event) {
            // The event object contains an item property.
            // is is a ListItem referencing the associated layer
            // and other properties. You can control the visibility of the
            // item, its title, and actions using this object.

            const item = event.item;

          //if (item.title === "US Demographics") {
            // An array of objects defining actions to place in the LayerList.
            // By making this array two-dimensional, you can separate similar
            // actions into separate groups with a breaking line.

            

         //console.log(item.title+" vis: "+item.visible+" vis at scale: "+ item.visibleAtCurrentScale);
          // Adds a slider for updating a group layer's opacity
          //|| item.parent == null
          if((item.children.length == 0 && item.parent) || item.parent === null ){
            const slider = new Slider({
              min: 0,
              max: 1,
              precision: 2,
              values: [ item.layer.opacity ],
              visibleElements: {
                labels: true,
                rangeLabels: true
              }
              
            });

            item.panel = {
              content: slider,
              className: "esri-icon-sliders-horizontal",
              title: "Change layer opacity"
            }

            slider.on("thumb-drag", (event) => {
              const { value } = event;
              item.layer.opacity = value;
            })
          }
        }*/



        
        
        //view.when(() => {
         /* overviewMap.when(() => {
            setupOverviewMap();
          });
            //
            // Scale Bar
            //
            let scaleBar = new ScaleBar({
              view: view
              // mi & km  unit: "dual"
            });
            view.ui.add(scaleBar, {
              position: "bottom-left"
            });
            // Home
            const homeBtn = new Home({
              view: view
            });

            // Add the home button to the top left corner of the view
            view.ui.add(homeBtn, "top-left");*/
          
         //   view.ui.add(document.getElementById("fullExtent"),{
         //     position:"top-left"
         //   });

            
            //
            // Map Layers
            //
            // Create the LayerList widget with the associated actions
            // and add it to the top-right corner of the view.

            /*var tocPane = new TitlePane({
              title: "<div style='display:inline-flex;flex-direction:row;width:calc(100% - 15px);align-items:center;'><div><img id='tocIcon' alt='map layers icon' src='assets/images/i_layers.png'/></div><div style='flex-grow:3;'> Map Layers </div><div role='button'><img alt='help button' align='right' class='help_icon' src='assets/images/i_help.png'></div>"
            });
            tocPane.startup();
            document.getElementById("tocPane").appendChild(tocPane.domNode);
            
            var layerList = new LayerList({
              view: view,
              listItemCreatedFunction: defineActions,
              container: tocPane.containerNode.id
            });
            layerList.when(() => {
              // hide toc items
              var tocItems = document.getElementsByClassName("esri-layer-list__item--has-children");
              for (var i=0; i<tocItems.length;i++){
                var item=tocItems[i].children[0].children[1].children[1].innerHTML;
                // TODO read from config.xml hideGroupSubLayers
                if (['Emergency','Field Office','Chamber of Commerce or Welcome Center','License Agent','Campgrounds and SWA Facilities','GMU boundary (Hunting Units)'].includes(item) ){
                  // hide expand icon
                  tocItems[i].children[0].children[0].style.visibility = "hidden";
                  // hide the ul of zoom levels
                  tocItems[i].children[1].style.display = "none";
                }
              }
            });

            // Event listener that fires each time an action is triggered
            layerList.on("trigger-action", (event) => {
              // The layer visible in the view at the time of the trigger.
              const layer = event.item.layer;

              // Capture the action id.
              const id = event.action.id;

              if (id === "full-extent") {
                // if the full-extent action is triggered then navigate
                // to the full extent of the visible layer
                view.goTo(visibleLayer.fullExtent)
                .catch((error) => {
                  if (error.name != "AbortError"){
                    console.error(error);
                  }
                });
              } else if (id === "information") {
                // if the information action is triggered, then
                // open the item details page of the service layer
                window.open(layer.url);
              } else if (id === "increase-opacity") {
                // if the increase-opacity action is triggered, then
                // increase the opacity of the GroupLayer by 0.25

                if (layer.opacity < 2) {
                  layer.opacity += 0.25;
                }
              } else if (id === "decrease-opacity") {
                // if the decrease-opacity action is triggered, then
                // decrease the opacity of the GroupLayer by 0.25
                if (layer.opacity > 0) {
                  layer.opacity -= 0.25;
                }
              }
            });*/
            
            

            

           // document.getElementById("loadingImg").style.display = "none";
       // });  // view when