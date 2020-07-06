const express = require('express');

const router = express.Router();
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

// router.route('/:tourId/reviews').post(authController.protect, authController.restrict('user'), reviewController.createReview);

// router.param('id', tourController.checkID);

router.use('/:tourId/reviews', reviewRouter);

// tours routes
router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
    .route('/monthly-plan/:year')
    .get(
        authController.protect,
        authController.restrict('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan
    );

router
    .route('/')
    .get(tourController.getAllTours)
    .post(
        authController.protect,
        authController.restrict('admin', 'lead-guide'),
        tourController.createTour
    );

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(
        authController.protect,
        authController.restrict('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour
    )
    .delete(
        authController.protect,
        authController.restrict('admin', 'lead-guide'),
        tourController.deleteTour
    );

router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

//exporting the routes
module.exports = router;