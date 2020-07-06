const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
// const APIFeatures = require('./../utils/APIFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');

// exports.checkID = (req, res, next, val) => {
//     console.log(`Tour id is: ${val}`);
//     if (req.params.id * 1 > tours.length) {
//         return res.status(404).json({
//             status: 'fail',
//             message: 'Invalid id'
//         })
//     }
//     next();
// }

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([{
        name: 'imageCover',
        maxCount: 1
    },
    {
        name: 'images',
        maxCount: 3
    }
]);

// note
// upload.single('image'); -- a single field that accepts an image
// upload.array('images', 5); -- one field that accepts multiple images

exports.resizeTourImages = catchAsync(async(req, res, next) => {
    // console.log(req.files);

    if (!req.files.imageCover || !req.files.images) return next();

    // 1) imageCover
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({
            quality: 90
        })
        .toFile(`public/img/tours/${req.body.imageCover}`);

    // 2) images
    req.body.images = [];
    await Promise.all(
        req.files.images.map(async(file, i) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

            await sharp(file.buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({
                    quality: 90
                })
                .toFile(`public/img/tours/${filename}`);

            req.body.images.push(filename);
        })
    );

    next();
});

// tours route handlers

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

    next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, {
    path: 'reviews'
});

exports.createTour = factory.createOne(Tour);
// exports.createTour = catchAsync(async(req, res, next) => {
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//         status: 'success',
//         data: {
//             tour: newTour
//         }
//     });
// });

exports.updateTour = factory.updateOne(Tour);
// exports.updateTour = catchAsync(async(req, res, next) => {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         new: true,
//         runValidators: true
//     });

//     if (!tour) {
//         return next(new AppError('No tour found with that ID', 404));
//     }

//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour
//         }
//     });
// });

exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async(req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if (!tour) {
//         return next(new AppError('No tour found with that ID', 404));
//     }

//     res.status(204).json({
//         status: 'success',
//         data: null
//     });
// });

exports.getTourStats = catchAsync(async(req, res, next) => {
    const stats = await Tour.aggregate([{
            $match: {
                ratingsAverage: {
                    $gte: 4.5
                }
            }
        },
        {
            $group: {
                _id: '$difficulty',
                numTours: {
                    $sum: 1
                },
                numRatings: {
                    $sum: '$ratingsQuantity'
                },
                avgRating: {
                    $avg: '$ratingsAverage'
                },
                avgPrice: {
                    $avg: '$price'
                },
                minPrice: {
                    $min: '$price'
                },
                maxPrice: {
                    $max: '$price'
                }
            }
        },
        {
            $sort: {
                avgRating: -1
            }
        } // ,
        // {
        //     $match: {
        //         _id: {
        //             $ne: 'easy'
        //         }
        //     }
        // }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});

exports.getMonthlyPlan = catchAsync(async(req, res, next) => {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([{
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: {
                    $month: '$startDates'
                },
                numTourStarts: {
                    $sum: 1
                },
                tours: {
                    $push: '$name'
                }
            }
        },
        {
            $addFields: {
                month: '$_id'
            }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: {
                numTourStarts: -1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    });
});

// /tours-within/233/center/34.112045, -118.121010/unit/mi
exports.getToursWithin = catchAsync(async(req, res, next) => {
    const { distance, latlng, unit } = req.params;

    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3958.8 : distance / 6371;
    // 3963.2
    if (!lat || !lng) {
        return new AppError(
            'Please provide latitude and longitude in the format lat, lng.',
            400
        );
    }

    console.log(distance, lat, lng, unit);

    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [
                    [lng, lat], radius
                ]
            }
        }
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    });
});

exports.getDistances = catchAsync(async(req, res, next) => {
    const { latlng, unit } = req.params;

    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
    // 3963.2
    if (!lat || !lng) {
        return new AppError(
            'Please provide latitude and longitude in the format lat, lng.',
            400
        );
    }

    const distances = await Tour.aggregate([{
            $geoNear: {
                // this always has to be the first one in the pipeline and one of the fields has to contain a geo index.
                //near's point from which to calculate the distances:: distances will be calculated btn this point and a startLocations
                near: {
                    // this is where we specify lat and long and it has to have a type of geoJSON wch is point
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1] // mutiplying by one to convert then to numbers
                },
                // distanceField is the field that will be created and all calculated distances will be stored here
                distanceField: 'distance',
                distanceMultiplier: multiplier //here you specify a number that will multiply all the calculated distances
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    });
});