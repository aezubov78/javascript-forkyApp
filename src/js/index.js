import Search from './modules/Search';
import Recipe from './modules/Recipe';
import List from './modules/List';
import * as searchView from './views/searchView';
import {elements, renderLoader, clearLoader} from './views/base';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import Likes from './modules/Likes';
import * as likesView from './views/likesView';

// Global state of the app
// 1. search object
// 2. current recipe object
// 3. shopping list object
// 4. Liked recipes

const state = {};

// Search Controller
const controlSearch = async () => {
    // 1) Get query from the view
  const query = searchView.getInput();  
    
    if(query) {
        // 2) New search object and add to state
        state.search = new Search(query);

        // 3) prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
        // 4) Search for recipes
        await state.search.getResults();
        // 5) render results on UI
        clearLoader();
        searchView.renderResults(state.search.result);
        }catch(error) {
            alert('Something wrong with the search...');
            clearLoader();
        }        
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if(btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

// Recipe Controller

const controlRecipe = async () => {
    // Get ID from url
    const id = window.location.hash.replace('#', '');
    
    if(id) {
        // prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highlight selected search item
        if(state.search) searchView.highLightSelected(id);

        // create new recipe object
        state.recipe = new Recipe(id);        
        
        try{
            // get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

        // calculate servings and time
        state.recipe.calcTime();
        state.recipe.calcServings();
        // render the recipe
        clearLoader();
        recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
       

        }catch(error) {
            alert('Error processing recipe');
            console.log(error);
        }
    }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

// Shopping list Controller

const controlList = () => {
    // Create a new list if there's none yet
    if(!state.list) state.list = new List();

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};

//handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    // handle the delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        // delete from state
        state.list.deleteItem(id);
        // delete from UI
        listView.deleteItem(id);
        // handle the count update
    }else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

//---------------------
// Likes Controller
//----------------------

const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id
    // User has not yet liked current recipe
    if(!state.likes.isLiked(currentID)) {
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
            );
        // Toggle the like button
        likesView.toggleLikeBtn(true);

        // Add like to UI list
        likesView.renderLike(newLike);
        
    // User has liked current recipe
    }else {
        // Remove like from the state state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        likesView.toggleLikeBtn(false);

        // Remove like from UI list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumberLikes());
};

// restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    // restore likes
    state.likes.readStorage();
    // toggle like menu botton
    likesView.toggleLikeMenu(state.likes.getNumberLikes());
    // redner the existence liked recipes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});


// handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if(state.recipe.servings > 1 ) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
          }        
    }else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Add ingredients to shopping list
        controlList();
    }else if (e.target.matches('.recipe__love, .recipe__love *')) {
        //Like controler
        controlLike();
    }    
});


// 280df59c9f07d6919d568400081b972d

// https://www.food2fork.com/api/search

// https://cors-anywhere.herokuapp.com/




