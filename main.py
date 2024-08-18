#!/usr/bin/env python
# -*- coding: UTF-8 -*-
"""
@Project: calcI
@File: main.py
@IDE: PyCharm
@Author: paidaxing
@Date: 2024/8/18 17:22
"""
import math
import numpy_financial as npf


def average_capital_plus_interest(loan_principal: int, interest_rate: float, periods: int) -> None:
    """
    等额本息
    :param loan_principal: 贷款本金
    :param interest_rate: 贷款月利率
    :param periods: 贷款月周期
    :return: None
    """
    monthly_payment = loan_principal * interest_rate * (1 + interest_rate) ** periods / (
            (1 + interest_rate) ** periods - 1)
    cash_flow = [-loan_principal] + [monthly_payment] * periods
    irr = npf.irr(cash_flow)
    apr = (1 + irr) ** 12 - 1
    print('===> 总利息 {:>,.2f} 元'.format(monthly_payment * periods - loan_principal))
    for i in range(1, periods):
        interest = loan_principal * interest_rate
        capital = monthly_payment - interest
        loan_principal = loan_principal - capital
        print('===> 第 {} 月: 偿还利息 {:>,.2f} 元 偿还本金 {:>,.2f} 元 还款额 {:>,.2f} 元'.format(i, interest, capital, monthly_payment))
    print('===> 内含报酬率为：{:>,.2%}'.format(irr))
    print('===> 月利率 {:>,.2%} 年利率 {:>,.2%} 年利化率为：{:>,.2%}'.format(interest_rate, interest_rate * 12, apr))


def average_capital(loan_principal: int, interest_rate: float, periods: int) -> None:
    """
    等额本金
    :param loan_principal: 贷款本金
    :param interest_rate: 贷款月利率
    :param periods: 贷款月周期
    :return: None
    """
    cash_flow = [-loan_principal]
    capital = loan_principal / periods
    total_interest = 0
    for i in range(1, periods + 1):
        interest = loan_principal * interest_rate
        loan_principal = loan_principal - capital
        monthly_payment = interest + capital
        print('===> 第 {} 月: 偿还利息 {:>,.2f} 元 偿还本金 {:>,.2f} 元 还款额 {:>,.2f} 元'.format(i, interest, capital, monthly_payment))
        cash_flow = cash_flow + [monthly_payment]
        total_interest+=interest
    print('===> 总利息 {:>,.2f} 元'.format(total_interest))
    irr = npf.irr(cash_flow)
    print('===> 内含报酬率为：{:>,.2f}'.format(irr))
    apr = (1 + irr) ** 12 - 1
    print('===> 月利率 {:>,.2%} 年利率 {:>,.2%} 年利化率为：{:>,.2%}'.format(interest_rate, interest_rate * 12, apr))


def equal_capital_and_interest(loan_principal: int, interest_rate: float, periods: int) -> None:
    """
    等本等息
    :param loan_principal: 贷款金额
    :param interest_rate: 贷款月利率
    :param periods: 贷款月周期
    :return: None
    """
    b = loan_principal / periods
    i = loan_principal * interest_rate
    monthly_payment = b + i
    print('===> 总利息 {:>,.2f} 元'.format(i * 60))
    print('===> 每月偿还本金为 {:>,.2f} 元 利息 {:>,.2f} 元 还款额 {:>,.2f} 元'.format(b, i, monthly_payment))
    cash_flow = [-loan_principal] + [monthly_payment] * periods
    irr = npf.irr(cash_flow)
    print('===> 内含报酬率为：{:>,.2f}'.format(irr))
    apr = (1 + irr) ** 12 - 1
    print('===> 月利率 {:>,.2%} 年利率 {:>,.2%} 年利化率为：{:>,.2%}'.format(interest_rate, interest_rate * 12, apr))


def interest_before_capital(loan_principal: int, interest_rate: float, periods: int) -> None:
    """
    先息后本
    :param loan_principal: 贷款金额
    :param interest_rate: 贷款月利率
    :param periods: 贷款月周期
    :return: None
    """
    print('该还款方式仅还利息，到期一次性偿还本金')
    monthly_payment = loan_principal * interest_rate
    print('===> 总利息 {:>,.2f} 元'.format(monthly_payment * periods))
    print('===> 月还款额 {:>,.2f} 元 最后一期 {:>,.2f} 元'.format(monthly_payment, monthly_payment + loan_principal))
    apr = interest_rate * 12
    print('===> 月利率 {:>,.2%} 年利率 {:>,.2%} 年利化率为：{:>,.2%}'.format(interest_rate, interest_rate * 12, apr))


def repay_the_principal_and_interest_at_one_time(loan_principal: int, interest_rate: float, periods: int) -> None:
    """
    一次性还本付息
    :param loan_principal: 贷款金额
    :param interest_rate: 贷款月利率
    :param periods: 贷款月周期
    :return: None
    """
    print('该还款方式为一次性偿还本金和全部利息')
    monthly_payment = loan_principal * math.ceil(periods / 12) * interest_rate * 12
    print('===> 总利息为 {:>,.2f} 元 总还款额 {:>,.2f} 元'.format(monthly_payment, monthly_payment + loan_principal))
    apr = interest_rate * 12
    print('===> 月利率 {:>,.2%} 年利率 {:>,.2%} 年利化率为：{:>,.2%}'.format(interest_rate, interest_rate * 12, apr))


if __name__ == '__main__':
    print('以月还为基础计算，其他周期利率请勿使用'.center(80, '='))
    loan_principal = int(input('请输入贷款本金：'))
    interest_rate = float(input('请输入每期利率(月)：'))
    periods = int(input('请输入分期期数：'))
    method = input(
        '请输入还款方式:\n(1) 月等额本息\n(2) 月等额本金\n(3) 月等本等息\n(4) 先息后本\n(5) 一次性还本付息\n')
    if method == '1':
        average_capital_plus_interest(loan_principal, interest_rate, periods)
    elif method == '2':
        average_capital(loan_principal, interest_rate, periods)
    elif method == '3':
        equal_capital_and_interest(loan_principal, interest_rate, periods)
    elif method == '4':
        interest_before_capital(loan_principal, interest_rate, periods)
    elif method == '5':
        repay_the_principal_and_interest_at_one_time(loan_principal, interest_rate, periods)
    else:
        print("若你还款方式为随借随还，请自行计算利息，年利化率等于年利率")



