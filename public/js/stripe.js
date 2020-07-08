/* eslint-disable */
import axios from 'axios';
import {
    showAlert
} from './alerts';

const stripe = Stripe('pk_test_51H0OgnGaieo91b260PlaNR9gaYsSajPSX5bRDpZgmyxvjE879izQDz6BddxZC3KPMzZDbyZcnlYPDdamNDwLYKMo00Fl0OC849');

export const bookTour = async tourId => {
    try {
        // 1) Get checkout session from API
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
        // console.log(session);
        // 2) Create checkout form + charge the credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });

    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }

}